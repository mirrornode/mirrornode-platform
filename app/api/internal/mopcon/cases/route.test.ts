import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/env/mopconCases', () => ({
  mopconCasesEnv: {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    MOPCON_CASES_READ_SECRET: 'read-secret-test',
  },
}));

import { GET } from './route';

function request(token?: string) {
  return new Request('http://localhost/api/internal/mopcon/cases', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

describe('GET /api/internal/mopcon/cases', () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.select.mockReset();
    mocks.eq.mockReset();
    mocks.order.mockReset();
    mocks.limit.mockReset();

    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ order: mocks.order });
    mocks.order.mockReturnValue({ limit: mocks.limit });
    mocks.limit.mockResolvedValue({ data: [], error: null });

    mocks.createClient.mockReturnValue({
      from: () => ({ select: mocks.select }),
    });
  });

  it('fails closed without the read secret', async () => {
    const res = await GET(request() as never);

    expect(res.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('fails closed for the wrong read secret', async () => {
    const res = await GET(request('wrong-secret') as never);

    expect(res.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns only the minimum masked case projection', async () => {
    mocks.limit.mockResolvedValueOnce({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          customer_email: 'customer@example.com',
          flow: 'osiris-audit-v1',
          status: 'paid',
          fulfillment_status: 'intake_complete',
          created_at: '2026-08-31T00:00:00.000Z',
          updated_at: '2026-08-31T01:00:00.000Z',
          intake_submitted_at: '2026-08-31T00:30:00.000Z',
          operator_reviewed_at: null,
          fulfillment_started_at: null,
          delivered_at: null,
          intake_artifact_links: ['https://example.com/private-artifact'],
          intake_system_summary: 'must never be projected',
          stripe_session_id: 'cs_secret',
        },
      ],
      error: null,
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toEqual([
      {
        case_id: '11111111-1111-1111-1111-111111111111',
        customer: 'c***@example.com',
        flow: 'osiris-audit-v1',
        payment_status: 'paid',
        fulfillment_status: 'intake_complete',
        created_at: '2026-08-31T00:00:00.000Z',
        updated_at: '2026-08-31T01:00:00.000Z',
        intake_recorded: true,
        intake_submitted_at: '2026-08-31T00:30:00.000Z',
        artifact_count: 1,
        operator_reviewed_at: null,
        fulfillment_started_at: null,
        delivered_at: null,
      },
    ]);
    expect(JSON.stringify(body)).not.toContain('private-artifact');
    expect(JSON.stringify(body)).not.toContain('must never be projected');
    expect(JSON.stringify(body)).not.toContain('cs_secret');
    expect(mocks.eq).toHaveBeenCalledWith('flow', 'osiris-audit-v1');
  });

  it('returns 502 without leaking database details when the projection fails', async () => {
    mocks.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'sensitive database detail' },
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Unable to read case projection.' });
    expect(JSON.stringify(body)).not.toContain('sensitive database detail');
  });
});
