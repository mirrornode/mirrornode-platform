import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  inFilter: vi.fn(),
  lt: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  recheck: vi.fn(),
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
    intake_system_summary: 'must never be projected',
    stripe_session_id: 'cs_secret',
  };
}

describe('GET /api/internal/mopcon/cases', () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.select.mockReset();
    mocks.eq.mockReset();
    mocks.inFilter.mockReset();
    mocks.lt.mockReset();
    mocks.order.mockReset();
    mocks.limit.mockReset();
    mocks.recheck.mockReset();

    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ in: mocks.inFilter });
    mocks.inFilter.mockImplementation((column: string, values: string[]) => {
      if (column === 'id') return mocks.recheck(values);
      return { lt: mocks.lt, order: mocks.order };
    });
    mocks.lt.mockReturnValue({ order: mocks.order });
    mocks.order.mockReturnValue({ order: mocks.order, limit: mocks.limit });
    mocks.limit.mockResolvedValue({ data: [], error: null });
    mocks.recheck.mockImplementation(async (ids: string[]) => ({
      data: ids.map((id) => row(id)),
      error: null,
    }));

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
    const caseId = '11111111-1111-1111-1111-111111111111';
    mocks.limit.mockResolvedValueOnce({
      data: [row(caseId)],
      error: null,
    });

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
    expect(JSON.stringify(body)).not.toContain('must never be projected');
    expect(JSON.stringify(body)).not.toContain('cs_secret');
    expect(mocks.eq).toHaveBeenCalledWith('flow', 'osiris-audit-v1');
    expect(mocks.inFilter).toHaveBeenCalledWith('fulfillment_status', [
      'intake_pending',
      'intake_complete',
      'fulfillment_started',
      'paused',
    ]);
    expect(mocks.inFilter).toHaveBeenCalledWith('fulfillment_status', ['delivered', 'refunded']);
    expect(mocks.inFilter).toHaveBeenCalledWith('id', [caseId]);
    expect(mocks.order).toHaveBeenCalledWith('id', { ascending: false });
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mocks.limit).toHaveBeenCalledWith(500);
    expect(mocks.limit).toHaveBeenCalledWith(100);
  });

  it('uses an immutable UUID keyset cursor until every actionable case has been retrieved', async () => {
    const firstPage = [
      ...Array.from({ length: 499 }, (_, index) => row(`case-${String(999 - index).padStart(4, '0')}`)),
      row('case-cursor'),
    ];
    const finalPage = [row('case-after-cursor')];

    mocks.limit
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: finalPage, error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(501);
    expect(mocks.lt).toHaveBeenCalledTimes(1);
    expect(mocks.lt).toHaveBeenCalledWith('id', 'case-cursor');
    expect(mocks.limit).toHaveBeenNthCalledWith(1, 500);
    expect(mocks.limit).toHaveBeenNthCalledWith(2, 500);
    expect(mocks.limit).toHaveBeenNthCalledWith(3, 100);
    expect(mocks.recheck).toHaveBeenCalledTimes(6);
    expect(body.coverage.actionable).toBe('all matching rows, UUID-keyset paged and id-rechecked');
  });

  it('uses the later id recheck when a case transitions to terminal state during the read', async () => {
    const caseId = '22222222-2222-2222-2222-222222222222';

    mocks.limit
      .mockResolvedValueOnce({ data: [row(caseId, 'fulfillment_started')], error: null })
      .mockResolvedValueOnce({ data: [row(caseId, 'delivered')], error: null });
    mocks.recheck.mockResolvedValueOnce({
      data: [row(caseId, 'delivered')],
      error: null,
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(1);
    expect(body.cases[0].case_id).toBe(caseId);
    expect(body.cases[0].fulfillment_status).toBe('delivered');
    expect(body.cases[0].delivered_at).toBe('2026-08-31T02:00:00.000Z');
  });

  it('rechecks an actionable case even when its terminal transition falls outside terminal history', async () => {
    const caseId = '33333333-3333-3333-3333-333333333333';
    const terminalHistory = Array.from({ length: 100 }, (_, index) =>
      row(`terminal-${String(index).padStart(3, '0')}`, 'delivered')
    );

    mocks.limit
      .mockResolvedValueOnce({ data: [row(caseId, 'fulfillment_started')], error: null })
      .mockResolvedValueOnce({ data: terminalHistory, error: null });
    mocks.recheck.mockResolvedValueOnce({
      data: [row(caseId, 'delivered')],
      error: null,
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();
    const projected = body.cases.find((item: { case_id: string }) => item.case_id === caseId);

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(101);
    expect(projected).toBeDefined();
    expect(projected.fulfillment_status).toBe('delivered');
    expect(projected.delivered_at).toBe('2026-08-31T02:00:00.000Z');
  });

  it('returns 502 without leaking database details when actionable projection fails', async () => {
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

  it('returns 502 without leaking database details when terminal-history projection fails', async () => {
    mocks.limit
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'sensitive terminal database detail' },
      });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Unable to read case projection.' });
    expect(JSON.stringify(body)).not.toContain('sensitive terminal database detail');
  });

  it('returns 502 without leaking database details when actionable id recheck fails', async () => {
    const caseId = '44444444-4444-4444-4444-444444444444';
    mocks.limit.mockResolvedValueOnce({ data: [row(caseId)], error: null });
    mocks.recheck.mockResolvedValueOnce({
      data: null,
      error: { message: 'sensitive recheck database detail' },
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Unable to read case projection.' });
    expect(JSON.stringify(body)).not.toContain('sensitive recheck database detail');
  });
});
