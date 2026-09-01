import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
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

function row(id: string, fulfillmentStatus = 'intake_complete') {
  return {
    id,
    customer_email: 'customer@example.com',
    flow: 'osiris-audit-v1',
    status: 'paid',
    fulfillment_status: fulfillmentStatus,
    created_at: '2026-08-31T00:00:00.000Z',
    updated_at: '2026-08-31T01:00:00.000Z',
    intake_submitted_at: '2026-08-31T00:30:00.000Z',
    operator_reviewed_at: null,
    fulfillment_started_at: null,
    delivered_at: fulfillmentStatus === 'delivered' ? '2026-08-31T02:00:00.000Z' : null,
    intake_artifact_links: ['https://example.com/private-artifact'],
  };
}

describe('GET /api/internal/mopcon/cases', () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.rpc.mockReset();
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.createClient.mockReturnValue({ rpc: mocks.rpc });
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
    const caseId = '11111111-1111-1111-1111-111111111111';
    mocks.rpc.mockResolvedValueOnce({ data: [row(caseId)], error: null });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toEqual([
      {
        case_id: caseId,
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
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('mopcon_case_projection');
  });

  it('returns all actionable rows supplied by one database snapshot call', async () => {
    const actionable = Array.from({ length: 501 }, (_, index) =>
      row(`case-${String(index).padStart(4, '0')}`)
    );
    const terminal = Array.from({ length: 100 }, (_, index) =>
      row(`terminal-${String(index).padStart(3, '0')}`, 'delivered')
    );
    mocks.rpc.mockResolvedValueOnce({ data: [...actionable, ...terminal], error: null });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(601);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(body.coverage.actionable).toBe('all matching rows from one PostgreSQL statement snapshot');
    expect(body.coverage.terminal_history).toBe('latest 100 from the same snapshot');
  });

  it('does not perform client-side pagination or status-race reconciliation', async () => {
    const caseId = '22222222-2222-2222-2222-222222222222';
    mocks.rpc.mockResolvedValueOnce({ data: [row(caseId, 'delivered')], error: null });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(1);
    expect(body.cases[0].fulfillment_status).toBe('delivered');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it('returns an empty projection when the snapshot has no cases', async () => {
    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it('returns 502 without leaking database details when the snapshot RPC fails', async () => {
    mocks.rpc.mockResolvedValueOnce({
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
