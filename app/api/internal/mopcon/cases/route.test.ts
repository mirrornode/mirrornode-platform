import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  inFilter: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
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
    delivered_at: null,
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
    mocks.order.mockReset();
    mocks.range.mockReset();
    mocks.limit.mockReset();

    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ in: mocks.inFilter });
    mocks.inFilter.mockReturnValue({ order: mocks.order });
    mocks.order.mockReturnValue({ range: mocks.range, limit: mocks.limit });
    mocks.range.mockResolvedValue({ data: [], error: null });
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
    mocks.range.mockResolvedValueOnce({
      data: [row('11111111-1111-1111-1111-111111111111')],
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
    expect(mocks.inFilter).toHaveBeenCalledWith('fulfillment_status', [
      'intake_pending',
      'intake_complete',
      'fulfillment_started',
      'paused',
    ]);
    expect(mocks.inFilter).toHaveBeenCalledWith('fulfillment_status', ['delivered', 'refunded']);
    expect(mocks.range).toHaveBeenCalledWith(0, 499);
    expect(mocks.limit).toHaveBeenCalledWith(100);
  });

  it('continues paging until every actionable case has been retrieved', async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) =>
      row(`case-${String(index).padStart(4, '0')}`)
    );
    const finalPage = [row('case-0500')];

    mocks.range
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: finalPage, error: null });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cases).toHaveLength(501);
    expect(mocks.range).toHaveBeenNthCalledWith(1, 0, 499);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 500, 999);
    expect(body.coverage.actionable).toBe('all matching rows, internally paged');
  });

  it('returns 502 without leaking database details when actionable projection fails', async () => {
    mocks.range.mockResolvedValueOnce({
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
    mocks.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'sensitive terminal database detail' },
    });

    const res = await GET(request('read-secret-test') as never);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: 'Unable to read case projection.' });
    expect(JSON.stringify(body)).not.toContain('sensitive terminal database detail');
  });
});
