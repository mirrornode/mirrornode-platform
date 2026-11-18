import { beforeEach, describe, expect, it, vi } from 'vitest';

type UpdateBuilder = {
  chain: Array<[string, ...unknown[]]>;
  eq: (...a: unknown[]) => UpdateBuilder;
  neq: (...a: unknown[]) => UpdateBuilder;
  in: (...a: unknown[]) => UpdateBuilder;
  select: (...a: unknown[]) => Promise<unknown>;
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>;
};

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  listSessions: vi.fn(),
  createClient: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
  builders: [] as UpdateBuilder[],
  secretKey: { value: 'sk_test_synthetic' },
}));

vi.mock('stripe', () => ({
  default: class Stripe {
    webhooks = { constructEvent: mocks.constructEvent };
    checkout = { sessions: { list: mocks.listSessions } };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/env/stripe', () => ({
  stripeEnv: {
    get STRIPE_SECRET_KEY() {
      return mocks.secretKey.value;
    },
    STRIPE_WEBHOOK_SECRET: 'whsec_synthetic',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  },
}));

import { POST } from './route';
import {
  checkOsirisCompletedSession,
  classifyRefund,
  expectedLivemode,
} from '@/lib/osiris-audit/webhook-gates';

function request() {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=synthetic' },
    body: '{}',
  }) as never;
}

function completedEvent(overrides: Record<string, unknown> = {}, livemode = false) {
  return {
    id: 'evt_synthetic_completed',
    type: 'checkout.session.completed',
    livemode,
    data: {
      object: {
        id: 'cs_test_synthetic',
        mode: 'payment',
        currency: 'usd',
        amount_total: 14900,
        payment_status: 'paid',
        status: 'complete',
        customer: 'cus_synthetic',
        customer_details: { email: null },
        metadata: { flow: 'osiris-audit-v1' },
        ...overrides,
      },
    },
  };
}

function refundEvent(amountRefunded: number, livemode = false) {
  return {
    id: 'evt_synthetic_refund',
    type: 'charge.refunded',
    livemode,
    data: {
      object: {
        id: 'ch_synthetic',
        amount: 14900,
        amount_refunded: amountRefunded,
        payment_intent: 'pi_synthetic',
      },
    },
  };
}

/** A chainable stand-in for supabase's update().eq().neq().in().select(). */
function updateBuilder(selectRows: unknown[] = [{ fulfillment_status: 'paused' }]): UpdateBuilder {
  const b = { chain: [] } as unknown as UpdateBuilder;
  for (const m of ['eq', 'neq', 'in'] as const) {
    b[m] = (...a: unknown[]) => {
      b.chain.push([m, ...a]);
      return b;
    };
  }
  b.select = () => Promise.resolve({ data: selectRows, error: null });
  b.then = (resolve, reject) => Promise.resolve({ error: null }).then(resolve, reject);
  return b;
}

function osirisSessionList() {
  return { data: [{ id: 'cs_test_synthetic', metadata: { flow: 'osiris-audit-v1' } }] };
}

describe('webhook gates (pure)', () => {
  it('derives the expected Stripe mode from the key', () => {
    expect(expectedLivemode('sk_live_x')).toBe(true);
    expect(expectedLivemode('rk_live_x')).toBe(true);
    expect(expectedLivemode('sk_test_x')).toBe(false);
  });

  it('accepts only the published offer', () => {
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: 14900 })).toEqual({ ok: true });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'USD', amount_total: 14900 })).toEqual({ ok: true });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: 100 })).toMatchObject({ reason: 'AMOUNT_MISMATCH' });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'eur', amount_total: 14900 })).toMatchObject({ reason: 'CURRENCY_MISMATCH' });
    expect(checkOsirisCompletedSession({ mode: 'subscription', currency: 'usd', amount_total: 14900 })).toMatchObject({ reason: 'NOT_PAYMENT_MODE' });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: null })).toMatchObject({ reason: 'AMOUNT_MISMATCH' });
  });

  it('classifies refunds', () => {
    expect(classifyRefund({ amount: 14900, amount_refunded: 14900 })).toBe('full');
    expect(classifyRefund({ amount: 14900, amount_refunded: 5000 })).toBe('partial');
    expect(classifyRefund({ amount: 14900, amount_refunded: 0 })).toBe('none');
  });
});

describe('POST /api/webhook', () => {
  beforeEach(() => {
    mocks.secretKey.value = 'sk_test_synthetic';
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.maybeSingle.mockResolvedValue({ data: { fulfillment_status: 'intake_complete' }, error: null });
    mocks.builders = [];
    mocks.update.mockImplementation(() => {
      const b = updateBuilder();
      mocks.builders.push(b);
      return b;
    });
    mocks.from.mockReturnValue({
      upsert: mocks.upsert,
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
      update: mocks.update,
    });
    mocks.createClient.mockReturnValue({ from: mocks.from });
    mocks.listSessions.mockResolvedValue(osirisSessionList());
  });

  it('does not echo signature verification errors', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload. secret detail');
    });
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid signature' });
  });

  it('records a completed session that matches the published offer', async () => {
    mocks.constructEvent.mockReturnValue(completedEvent());
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0][0]).toMatchObject({ stripe_session_id: 'cs_test_synthetic', status: 'paid' });
  });

  it.each([
    [{ amount_total: 100 }],
    [{ currency: 'eur' }],
    [{ mode: 'subscription' }],
  ])('ignores an Osiris session that does not match the offer: %o', async (overrides) => {
    mocks.constructEvent.mockReturnValue(completedEvent(overrides));
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: 'offer_mismatch' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('ignores a live event when running with a test key, and the reverse', async () => {
    mocks.constructEvent.mockReturnValue(completedEvent({}, true));
    let res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'livemode_mismatch' });

    mocks.secretKey.value = 'sk_live_synthetic';
    mocks.constructEvent.mockReturnValue(completedEvent({}, false));
    res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'livemode_mismatch' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('marks a fully refunded Osiris case as refunded', async () => {
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ refund: 'full', fulfillmentStatus: 'refunded' });
    expect(mocks.listSessions).toHaveBeenCalledWith({ payment_intent: 'pi_synthetic', limit: 1 });
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ status: 'refunded', fulfillment_status: 'refunded' });
    expect(mocks.builders[0].chain).toEqual([['eq', 'stripe_session_id', 'cs_test_synthetic']]);
  });

  it('marks a delivered case refunded on a full refund', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { fulfillment_status: 'delivered' }, error: null });
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(await res.json()).toMatchObject({ fulfillmentStatus: 'refunded' });
  });

  it('pauses an active case on a partial refund', async () => {
    mocks.constructEvent.mockReturnValue(refundEvent(5000));
    const res = await POST(request());
    expect(await res.json()).toMatchObject({ refund: 'partial', fulfillmentStatus: 'paused' });
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ status: 'partially_refunded', fulfillment_status: 'paused' });
    expect(mocks.builders[0].chain).toEqual([
      ['eq', 'stripe_session_id', 'cs_test_synthetic'],
      ['neq', 'status', 'refunded'],
      ['in', 'fulfillment_status', ['intake_pending', 'intake_complete', 'fulfillment_started']],
    ]);
  });

  it('never overwrites a state that changed after the read (race with a full refund or delivery)', async () => {
    // The read still says intake_complete, but the guarded writes match no row.
    mocks.update.mockImplementation(() => {
      const b = updateBuilder([]);
      mocks.builders.push(b);
      return b;
    });
    mocks.constructEvent.mockReturnValue(refundEvent(5000));
    const res = await POST(request());
    expect(res.status).toBe(200);
    for (const [i, call] of mocks.update.mock.calls.entries()) {
      const guarded = mocks.builders[i].chain.some(([m]) => m === 'in');
      expect(guarded || !('fulfillment_status' in (call[0] as object))).toBe(true);
      expect(mocks.builders[i].chain).toContainEqual(['neq', 'status', 'refunded']);
    }
  });

  it('records a partial refund on a delivered case without changing its state', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { fulfillment_status: 'delivered' }, error: null });
    const queued = [updateBuilder([]), updateBuilder([{ fulfillment_status: 'delivered' }])];
    mocks.update.mockImplementation(() => {
      const b = queued.shift()!;
      mocks.builders.push(b);
      return b;
    });
    mocks.constructEvent.mockReturnValue(refundEvent(5000));
    const res = await POST(request());
    expect(await res.json()).toMatchObject({ refund: 'partial', fulfillmentStatus: 'delivered' });
    expect(mocks.update.mock.calls[1][0]).not.toHaveProperty('fulfillment_status');
  });

  it('asks Stripe to retry when the refund arrives before the purchase row', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('ignores refunds for other products', async () => {
    mocks.listSessions.mockResolvedValue({ data: [{ id: 'cs_other', metadata: { flow: 'other' } }] });
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'not_osiris_audit' });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('ignores refunds for charges without a checkout session', async () => {
    mocks.listSessions.mockResolvedValue({ data: [] });
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'not_osiris_audit' });
  });

  it('returns 500 so Stripe retries when the session lookup fails', async () => {
    mocks.listSessions.mockRejectedValue(new Error('network'));
    mocks.constructEvent.mockReturnValue(refundEvent(14900));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
