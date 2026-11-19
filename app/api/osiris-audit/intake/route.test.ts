import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseRecorder } from '@/test-support/supabase-recorder';

const mocks = vi.hoisted(() => ({
  retrieveSession: vi.fn(),
  createClient: vi.fn(),
}));

const db = createSupabaseRecorder();

/** Upsert (insert if new), guarded payment-status update, then the intake write. */
function queueIntakeResults(intakeRows: unknown[] = [{ stripe_session_id: 'cs_test_paid' }]) {
  db.reset();
  db.queue({}, {}, { data: intakeRows });
}

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
    STRIPE_AUDIT_PRICE_ID: 'price_osiris_149',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  },
}));

import { POST } from './route';
import { OSIRIS_AUDIT_V1_CHANNEL_AUTHORIZATION_TEXT } from '@/lib/osiris-audit/authorization';

const validBody = {
  sessionId: 'cs_test_paid',
  systemSummary: 'A multi-repository AI orchestration system.',
  primaryGoal: 'Identify the highest-value structural improvements.',
  concerns: 'Repository drift and unclear runtime boundaries.',
  artifactLinks: ['https://example.com/repository'],
  additionalContext: 'Manual fulfillment is expected.',
  authorizationConfirmed: true,
};

function request(body: unknown) {
  return new Request('http://localhost/api/osiris-audit/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function paidAuditSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_paid',
    mode: 'payment',
    currency: 'usd',
    amount_total: 14900,
    customer: 'cus_test',
    customer_details: { email: 'customer@example.com' },
    metadata: { flow: 'osiris-audit-v1' },
    payment_status: 'paid',
    status: 'complete',
    line_items: {
      data: [
        {
          quantity: 1,
          price: { id: 'price_osiris_149' },
        },
      ],
    },
    ...overrides,
  };
}

describe('POST /api/osiris-audit/intake', () => {
  beforeEach(() => {
    mocks.retrieveSession.mockReset();
    mocks.createClient.mockReset();

    mocks.retrieveSession.mockResolvedValue(paidAuditSession());
    queueIntakeResults();
    mocks.createClient.mockReturnValue(db.client);
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

  it('returns 400 when authorization is not confirmed', async () => {
    const res = await POST(
      request({ ...validBody, authorizationConfirmed: false }) as never
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

  it('retrieves the session with line-item price expansion', async () => {
    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(200);
    expect(mocks.retrieveSession).toHaveBeenCalledWith('cs_test_paid', {
      expand: ['line_items.data.price'],
    });
  });

  it('returns 403 for an unpaid or wrong-flow session', async () => {
    mocks.retrieveSession.mockResolvedValueOnce(
      paidAuditSession({
        id: 'cs_test_unpaid',
        metadata: { flow: 'another-flow' },
        payment_status: 'unpaid',
      })
    );

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 403 for a paid session containing the wrong price', async () => {
    mocks.retrieveSession.mockResolvedValueOnce(
      paidAuditSession({
        line_items: {
          data: [{ quantity: 1, price: { id: 'price_other' } }],
        },
      })
    );

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 403 for a subscription-mode session even with matching metadata', async () => {
    mocks.retrieveSession.mockResolvedValueOnce(
      paidAuditSession({ mode: 'subscription' })
    );

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 403 for a paid session whose total does not match the published offer', async () => {
    mocks.retrieveSession.mockResolvedValueOnce(paidAuditSession({ amount_total: 100 }));

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns 409 when intake is already complete, fulfillment advanced, or the payment was refunded', async () => {
    queueIntakeResults([]);

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(409);
  });

  it('never writes Stripe payment_status over a refunded or held purchase, and never touches dispute state', async () => {
    await POST(request(validBody) as never);

    expect(db.ops[0]).toMatchObject({
      kind: 'upsert',
      options: { onConflict: 'stripe_session_id', ignoreDuplicates: true },
    });
    expect(db.ops[1]).toMatchObject({ kind: 'update', payload: { status: 'paid' } });
    expect(db.ops[1].filters).toContainEqual([
      'not',
      'status',
      'in',
      '(refunded,partially_refunded,needs_review)',
    ]);
    for (const op of db.ops) {
      expect(op.payload ?? {}).not.toHaveProperty('dispute_status');
      expect(op.payload ?? {}).not.toHaveProperty('dispute_id');
    }
  });

  it('only accepts intake for a purchase that is still paid and has no open or lost dispute', async () => {
    await POST(request(validBody) as never);

    expect(db.ops[2].filters).toEqual([
      ['eq', 'stripe_session_id', 'cs_test_paid'],
      ['eq', 'status', 'paid'],
      ['eq', 'fulfillment_status', 'intake_pending'],
      ['or', 'dispute_status.is.null,dispute_status.in.(won,warning_closed)'],
      ['is', 'intake_submitted_at', null],
    ]);
  });

  it('reconciles payment evidence and accepts a valid canonical intake', async () => {
    const res = await POST(request(validBody) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      accepted: true,
      fulfillmentStatus: 'intake_complete',
    });
    expect(db.ops[0].payload).toMatchObject({
      stripe_session_id: 'cs_test_paid',
      customer_email: 'customer@example.com',
      flow: 'osiris-audit-v1',
      status: 'paid',
    });
    expect(db.ops[2].payload).toEqual(
      expect.objectContaining({
        intake_system_summary: validBody.systemSummary,
        intake_primary_goal: validBody.primaryGoal,
        intake_artifact_links: validBody.artifactLinks,
        intake_authorization_confirmed_at: expect.any(String),
        intake_channel_authorization_text:
          OSIRIS_AUDIT_V1_CHANNEL_AUTHORIZATION_TEXT,
        fulfillment_status: 'intake_complete',
      })
    );
  });

  it('returns 500 when purchase reconciliation fails', async () => {
    db.reset();
    db.queue({ error: { message: 'database unavailable' } });

    const res = await POST(request(validBody) as never);

    expect(res.status).toBe(500);
  });
});
