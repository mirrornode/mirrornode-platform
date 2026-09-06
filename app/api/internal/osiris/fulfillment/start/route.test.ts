import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/env/osiris-operator', () => ({
  osirisOperatorEnv: {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    OPERATOR_TOKEN: 'operator-secret',
    OPERATOR_ACTOR_ID: 'siseon',
  },
}));

import { POST } from './route';

const validBody = {
  subject: {
    type: 'stripe_session_id',
    value: 'cs_test_paid',
  },
  idempotency_key: 'd43b50bb-e69c-4f70-97ac-7e15a26d7aa3',
  operator: {
    actor_id: 'siseon',
    reason: 'Authorized intake reviewed and accepted for audit.',
  },
};

const startedRow = {
  outcome: 'STARTED',
  case_session_id: 'cs_test_paid',
  fulfillment_status: 'fulfillment_started',
  activation_event_id: '0af2e558-a015-487e-a91e-c74d01495b93',
  idempotency_key: validBody.idempotency_key,
  operator_id: 'siseon',
  start_reason: validBody.operator.reason,
  operator_reviewed_at: '2026-09-06T14:20:00.000Z',
  fulfillment_started_at: '2026-09-06T14:20:00.000Z',
};

function request(
  body: unknown = validBody,
  authorization: string | null = 'Bearer operator-secret'
) {
  const headers = new Headers({ 'Content-Type': 'application/json' });

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  return new Request(
    'http://localhost/api/internal/osiris/fulfillment/start',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );
}

describe('POST /api/internal/osiris/fulfillment/start', () => {
  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.rpc.mockReset();

    mocks.createClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: [startedRow], error: null });
  });

  it('returns 401 without a bearer token', async () => {
    const res = await POST(request(validBody, null) as never);

    expect(res.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns 403 for an invalid operator token', async () => {
    const res = await POST(request(validBody, 'Bearer wrong-secret') as never);

    expect(res.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns 403 when the command actor does not match the authenticated operator', async () => {
    const res = await POST(
      request({
        ...validBody,
        operator: { ...validBody.operator, actor_id: 'other-operator' },
      }) as never
    );

    expect(res.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid command', async () => {
    const res = await POST(
      request({ ...validBody, idempotency_key: 'not-a-uuid' }) as never
    );

    expect(res.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('calls the bounded database transition for the canonical case subject', async () => {
    const res = await POST(request() as never);

    expect(res.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'start_osiris_audit_fulfillment_v1',
      expect.objectContaining({
        p_stripe_session_id: 'cs_test_paid',
        p_idempotency_key: validBody.idempotency_key,
        p_actor_id: 'siseon',
        p_reason: validBody.operator.reason,
        p_event_id: expect.any(String),
      })
    );
  });

  it('returns the activation receipt after a successful start', async () => {
    const res = await POST(request() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      accepted: true,
      idempotent: false,
      caseSubject: {
        type: 'stripe_session_id',
        value: 'cs_test_paid',
      },
      fulfillmentStatus: 'fulfillment_started',
      activationEventId: startedRow.activation_event_id,
      idempotencyKey: validBody.idempotency_key,
      operatorId: 'siseon',
      reason: validBody.operator.reason,
      operatorReviewedAt: startedRow.operator_reviewed_at,
      fulfillmentStartedAt: startedRow.fulfillment_started_at,
    });
  });

  it('returns the same receipt for an idempotent replay', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...startedRow, outcome: 'IDEMPOTENT' }],
      error: null,
    });

    const res = await POST(request() as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.idempotent).toBe(true);
    expect(body.activationEventId).toBe(startedRow.activation_event_id);
  });

  it('returns 409 when the idempotency key belongs to another case', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...startedRow, outcome: 'IDEMPOTENCY_CONFLICT' }],
      error: null,
    });

    const res = await POST(request() as never);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('returns 409 when the case fails a fulfillment precondition', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...startedRow, outcome: 'NOT_READY' }],
      error: null,
    });

    const res = await POST(request() as never);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('NOT_READY');
  });

  it('returns 404 when the case does not exist', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...startedRow, outcome: 'NOT_FOUND' }],
      error: null,
    });

    const res = await POST(request() as never);

    expect(res.status).toBe(404);
  });

  it('returns 500 when the database transition fails', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'database unavailable' },
    });

    const res = await POST(request() as never);

    expect(res.status).toBe(500);
  });

  it('returns 500 when the database transition returns no receipt', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });

    const res = await POST(request() as never);

    expect(res.status).toBe(500);
  });
});
