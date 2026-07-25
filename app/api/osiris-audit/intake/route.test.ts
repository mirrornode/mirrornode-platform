import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  retrieveSession: vi.fn(),
  createClient: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  eqSession: vi.fn(),
  eqFulfillment: vi.fn(),
  isIntakeNull: vi.fn(),
  selectUpdated: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class Stripe {
    checkout = {
      sessions: {
        retrieve: mocks.retrieveSession,
      },
    };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/env/stripe', () => ({
  stripeEnv: {
    STRIPE_SECRET_KEY: 'sk_test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  },
}));

import { POST } from './route';

const validBody = {
  sessionId: 'cs_test_paid',
  systemSummary: 'A multi-repository AI orchestration system.',
  primaryGoal: 'Identify the highest-value structural improvements.',
  concerns: 'Repository drift and unclear runtime boundaries.',
  artifactLinks: ['https://example.com/repository'],
  additionalContext: 'Manual fulfillment is expected.',
};

function request(body: unknown) {
  return new Request('http://localhost/api/osiris-audit/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/osiris-audit/intake', () => {
  beforeEach(() => {
    mocks.retrieveSession.mockResolvedValue({
      id: 'cs_test_paid',
      customer: 'cus_test',
      customer_details: { email: 'customer@example.com' },
      metadata: { flow: 'osiris-audit-v1' },
      payment_status: 'paid',
      status: 'complete',
    });

    mocks.upsert.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.eqSession });
    mocks.eqSession.mockReturnValue({ eq: mocks.eqFulfillment });
    mocks.eqFulfillment.mockReturnValue({ is: mocks.isIntakeNull });
    mocks.isIntakeNull.mockReturnValue({ select: mocks.selectUpdated });
    mocks.selectUpdated.mockResolvedValue({
      data: [{ stripe_session_id: 'cs_test_paid' }],
      error: null,
    });

    mocks.createClient.mockReturnValue({
      from: () => ({
        upsert: mocks.upsert,
        update: mocks.update,
      }),
    });
  });

  it('returns 400 for more than five artifact links', async () => {
    const res = await POST(
      request({
        ...validBody,
        artifactLinks: Array.from(
          { length: 6 },
          (_, index) => `https://example.com/artifact-${index}`
        ),
      }) as never
    );

    expect(res.status).toBe(400);
    expect(mocks.retrieveSession).not.toHaveBeenCalled();
  });

  it('returns 403 when Stripe cannot verify the session', async () => {
    mocks.retrieveSession.mockRejectedValueOnce(new Error('No such session'));

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 403 for an unpaid or wrong-flow session', async () => {
    mocks.retrieveSession.mockResolvedValueOnce({
      id: 'cs_test_unpaid',
      metadata: { flow: 'another-flow' },
      payment_status: 'unpaid',
    });

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 409 when intake is already complete or fulfillment advanced', async () => {
    mocks.selectUpdated.mockResolvedValueOnce({ data: [], error: null });

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(409);
  });

  it('reconciles payment evidence and accepts a valid intake', async () => {
    const res = await POST(request(validBody) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      accepted: true,
      fulfillmentStatus: 'intake_complete',
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: 'cs_test_paid',
        customer_email: 'customer@example.com',
        flow: 'osiris-audit-v1',
        status: 'paid',
      }),
      { onConflict: 'stripe_session_id' }
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        intake_system_summary: validBody.systemSummary,
        intake_primary_goal: validBody.primaryGoal,
        intake_artifact_links: validBody.artifactLinks,
        fulfillment_status: 'intake_complete',
      })
    );
  });

  it('returns 500 when purchase reconciliation fails', async () => {
    mocks.upsert.mockResolvedValueOnce({
      error: { message: 'database unavailable' },
    });

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(500);
  });
});
