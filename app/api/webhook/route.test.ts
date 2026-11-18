import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseRecorder } from '@/test-support/supabase-recorder';

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  listSessions: vi.fn(),
  listLineItems: vi.fn(),
  createClient: vi.fn(),
  secretKey: { value: 'sk_test_synthetic' },
}));

vi.mock('stripe', () => ({
  default: class Stripe {
    webhooks = { constructEvent: mocks.constructEvent };
    checkout = { sessions: { list: mocks.listSessions, listLineItems: mocks.listLineItems } };
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
    STRIPE_AUDIT_PRICE_ID: 'price_osiris_149',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
  },
}));

import { POST } from './route';
import {
  checkOsirisCompletedSession,
  checkOsirisOffer,
  classifyRefund,
  expectedLivemode,
  hasCanonicalAuditLineItem,
} from '@/lib/osiris-audit/webhook-gates';

const db = createSupabaseRecorder();
const PROTECTED = '(refunded,partially_refunded,disputed,needs_review)';
const PAUSABLE = ['intake_pending', 'intake_complete', 'fulfillment_started'];

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

function disputeEvent(paymentIntent: string | null = 'pi_synthetic') {
  return {
    id: 'evt_synthetic_dispute',
    type: 'charge.dispute.created',
    livemode: false,
    data: { object: { id: 'dp_synthetic', charge: 'ch_synthetic', payment_intent: paymentIntent } },
  };
}

function osirisSessionList() {
  return {
    data: [
      {
        id: 'cs_test_synthetic',
        customer: 'cus_synthetic',
        customer_details: { email: null },
        metadata: { flow: 'osiris-audit-v1' },
      },
    ],
  };
}

const canonicalItems = { data: [{ quantity: 1, price: { id: 'price_osiris_149' } }] };

describe('webhook gates (pure)', () => {
  it('derives the expected Stripe mode from the key', () => {
    expect(expectedLivemode('sk_live_x')).toBe(true);
    expect(expectedLivemode('rk_live_x')).toBe(true);
    expect(expectedLivemode('sk_test_x')).toBe(false);
  });

  it('accepts only the published offer facts', () => {
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: 14900 })).toEqual({ ok: true });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'USD', amount_total: 14900 })).toEqual({ ok: true });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: 100 })).toMatchObject({ reason: 'AMOUNT_MISMATCH' });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'eur', amount_total: 14900 })).toMatchObject({ reason: 'CURRENCY_MISMATCH' });
    expect(checkOsirisCompletedSession({ mode: 'subscription', currency: 'usd', amount_total: 14900 })).toMatchObject({ reason: 'NOT_PAYMENT_MODE' });
    expect(checkOsirisCompletedSession({ mode: 'payment', currency: 'usd', amount_total: null })).toMatchObject({ reason: 'AMOUNT_MISMATCH' });
  });

  it('applies the intake route price rule: canonical price at quantity one', () => {
    expect(hasCanonicalAuditLineItem(canonicalItems.data, 'price_osiris_149')).toBe(true);
    expect(hasCanonicalAuditLineItem([{ quantity: 2, price: { id: 'price_osiris_149' } }], 'price_osiris_149')).toBe(false);
    expect(hasCanonicalAuditLineItem([{ quantity: 1, price: { id: 'price_other' } }], 'price_osiris_149')).toBe(false);
    expect(hasCanonicalAuditLineItem(undefined, 'price_osiris_149')).toBe(false);
    const facts = { mode: 'payment', currency: 'usd', amount_total: 14900 };
    expect(checkOsirisOffer(facts, canonicalItems.data, 'price_osiris_149')).toEqual({ ok: true });
    expect(checkOsirisOffer(facts, [], 'price_osiris_149')).toMatchObject({ reason: 'PRICE_MISMATCH' });
    expect(checkOsirisOffer({ ...facts, amount_total: 1 }, canonicalItems.data, 'price_osiris_149')).toMatchObject({ reason: 'AMOUNT_MISMATCH' });
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
    db.reset();
    mocks.createClient.mockReturnValue(db.client);
    mocks.listSessions.mockResolvedValue(osirisSessionList());
    mocks.listLineItems.mockResolvedValue(canonicalItems);
  });

  it('does not echo signature verification errors', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload. secret detail');
    });
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid signature' });
  });

  it('ignores a live event when running with a test key, and the reverse', async () => {
    mocks.constructEvent.mockReturnValue(completedEvent({}, true));
    let res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'livemode_mismatch' });

    mocks.secretKey.value = 'sk_live_synthetic';
    mocks.constructEvent.mockReturnValue(completedEvent({}, false));
    res = await POST(request());
    expect(await res.json()).toMatchObject({ ignored: 'livemode_mismatch' });
    expect(db.ops).toHaveLength(0);
  });

  describe('checkout.session.completed', () => {
    it('records a matching session: insert if new, then a guarded status update', async () => {
      mocks.constructEvent.mockReturnValue(completedEvent());
      const res = await POST(request());
      expect(res.status).toBe(200);
      expect(mocks.listLineItems).toHaveBeenCalledWith('cs_test_synthetic', { limit: 10 });
      expect(db.ops).toHaveLength(2);
      expect(db.ops[0]).toMatchObject({
        kind: 'upsert',
        payload: { stripe_session_id: 'cs_test_synthetic', status: 'paid', flow: 'osiris-audit-v1' },
        options: { onConflict: 'stripe_session_id', ignoreDuplicates: true },
      });
      expect(db.ops[1]).toMatchObject({ kind: 'update', payload: { status: 'paid' } });
      expect(db.ops[1].filters).toEqual([
        ['eq', 'stripe_session_id', 'cs_test_synthetic'],
        ['not', 'status', 'in', PROTECTED],
      ]);
    });

    it('a replayed payment event can never write over a refund, dispute or review hold', async () => {
      mocks.constructEvent.mockReturnValue(completedEvent());
      await POST(request());
      await POST(request());
      const statusWrites = db.ops.filter((op) => op.kind === 'update');
      expect(statusWrites).toHaveLength(2);
      for (const op of statusWrites) {
        expect(op.filters).toContainEqual(['not', 'status', 'in', PROTECTED]);
      }
      for (const op of db.ops.filter((o) => o.kind === 'upsert')) {
        expect(op.options).toMatchObject({ ignoreDuplicates: true });
      }
    });

    it.each([
      [{ amount_total: 100 }, 'AMOUNT_MISMATCH'],
      [{ currency: 'eur' }, 'CURRENCY_MISMATCH'],
      [{ mode: 'subscription' }, 'NOT_PAYMENT_MODE'],
    ])('holds a session that does not match the offer for review: %o', async (overrides, reason) => {
      mocks.constructEvent.mockReturnValue(completedEvent(overrides));
      const res = await POST(request());
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ review: 'offer_mismatch', reason });
      expect(db.ops[0]).toMatchObject({
        kind: 'upsert',
        payload: { status: 'needs_review', fulfillment_status: 'paused' },
        options: { ignoreDuplicates: true },
      });
      expect(db.ops[1]).toMatchObject({ kind: 'update', payload: { status: 'needs_review', fulfillment_status: 'paused' } });
      expect(db.ops[1].filters).toContainEqual(['not', 'status', 'in', '(refunded,partially_refunded,disputed)']);
      expect(db.ops[1].filters).toContainEqual(['in', 'fulfillment_status', PAUSABLE]);
    });

    it('holds a session with the wrong price or quantity for review, like intake refuses it', async () => {
      mocks.listLineItems.mockResolvedValue({ data: [{ quantity: 2, price: { id: 'price_osiris_149' } }] });
      mocks.constructEvent.mockReturnValue(completedEvent());
      const res = await POST(request());
      expect(await res.json()).toMatchObject({ review: 'offer_mismatch', reason: 'PRICE_MISMATCH' });
      expect(db.ops.every((op) => (op.payload as { status?: string }).status === 'needs_review')).toBe(true);
    });

    it('asks Stripe to retry when line items cannot be read, and writes nothing', async () => {
      mocks.listLineItems.mockRejectedValue(new Error('network'));
      mocks.constructEvent.mockReturnValue(completedEvent());
      const res = await POST(request());
      expect(res.status).toBe(500);
      expect(db.ops).toHaveLength(0);
    });

    it('returns 500 when the ledger write fails', async () => {
      db.queue({ error: { message: 'boom' } });
      mocks.constructEvent.mockReturnValue(completedEvent());
      const res = await POST(request());
      expect(res.status).toBe(500);
      expect(db.ops).toHaveLength(1);
    });
  });

  describe('charge.refunded', () => {
    it('marks a fully refunded case refunded, over any state', async () => {
      mocks.constructEvent.mockReturnValue(refundEvent(14900));
      const res = await POST(request());
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ refund: 'full', fulfillmentStatus: 'refunded' });
      expect(mocks.listSessions).toHaveBeenCalledWith({ payment_intent: 'pi_synthetic', limit: 1 });
      expect(db.ops[0]).toMatchObject({
        kind: 'upsert',
        payload: { status: 'refunded', fulfillment_status: 'refunded' },
        options: { ignoreDuplicates: true },
      });
      expect(db.ops[1]).toMatchObject({ kind: 'update', payload: { status: 'refunded', fulfillment_status: 'refunded' } });
      expect(db.ops[1].filters).toEqual([['eq', 'stripe_session_id', 'cs_test_synthetic']]);
    });

    it('pauses an active case on a partial refund with one conditional write', async () => {
      db.queue({}, { data: [{ fulfillment_status: 'paused' }] });
      mocks.constructEvent.mockReturnValue(refundEvent(5000));
      const res = await POST(request());
      expect(await res.json()).toMatchObject({ refund: 'partial', fulfillmentStatus: 'paused' });
      expect(db.ops).toHaveLength(2);
      expect(db.ops[1]).toMatchObject({ payload: { status: 'partially_refunded', fulfillment_status: 'paused' } });
      expect(db.ops[1].filters).toEqual([
        ['eq', 'stripe_session_id', 'cs_test_synthetic'],
        ['not', 'status', 'in', '(refunded)'],
        ['in', 'fulfillment_status', PAUSABLE],
      ]);
    });

    it('records a partial refund on a delivered case without touching its state or a refunded row', async () => {
      db.queue({}, { data: [] }, { data: [{ fulfillment_status: 'delivered' }] });
      mocks.constructEvent.mockReturnValue(refundEvent(5000));
      const res = await POST(request());
      expect(await res.json()).toMatchObject({ refund: 'partial', fulfillmentStatus: 'delivered' });
      expect(db.ops[2].payload).toEqual({ status: 'partially_refunded', updated_at: expect.any(String) });
      expect(db.ops[2].filters).toEqual([
        ['eq', 'stripe_session_id', 'cs_test_synthetic'],
        ['not', 'status', 'in', '(refunded)'],
        ['neq', 'fulfillment_status', 'refunded'],
      ]);
    });

    it('creates the row in its refunded state when the refund arrives first, so Stripe does not retry', async () => {
      mocks.constructEvent.mockReturnValue(refundEvent(14900));
      const res = await POST(request());
      expect(res.status).toBe(200);
      expect(db.ops[0].payload).toMatchObject({
        stripe_session_id: 'cs_test_synthetic',
        flow: 'osiris-audit-v1',
        status: 'refunded',
        fulfillment_status: 'refunded',
      });
    });

    it('creates a paused row when a partial refund arrives first', async () => {
      mocks.constructEvent.mockReturnValue(refundEvent(5000));
      await POST(request());
      expect(db.ops[0].payload).toMatchObject({ status: 'partially_refunded', fulfillment_status: 'paused' });
    });

    it('ignores refunds for other products and charges without a session', async () => {
      mocks.listSessions.mockResolvedValue({ data: [{ id: 'cs_other', metadata: { flow: 'other' } }] });
      mocks.constructEvent.mockReturnValue(refundEvent(14900));
      expect(await (await POST(request())).json()).toMatchObject({ ignored: 'not_osiris_audit' });

      mocks.listSessions.mockResolvedValue({ data: [] });
      expect(await (await POST(request())).json()).toMatchObject({ ignored: 'not_osiris_audit' });
      expect(db.ops).toHaveLength(0);
    });

    it('returns 500 so Stripe retries when the session lookup fails', async () => {
      mocks.listSessions.mockRejectedValue(new Error('network'));
      mocks.constructEvent.mockReturnValue(refundEvent(14900));
      const res = await POST(request());
      expect(res.status).toBe(500);
      expect(db.ops).toHaveLength(0);
    });

    it('returns 500 when a refund write fails', async () => {
      db.queue({}, { error: { message: 'boom' } });
      mocks.constructEvent.mockReturnValue(refundEvent(5000));
      const res = await POST(request());
      expect(res.status).toBe(500);
    });
  });

  describe('charge.dispute.created', () => {
    it('marks the payment disputed and pauses an active case', async () => {
      db.queue({}, { data: [{ fulfillment_status: 'paused' }] });
      mocks.constructEvent.mockReturnValue(disputeEvent());
      const res = await POST(request());
      expect(await res.json()).toMatchObject({ dispute: 'opened', fulfillmentStatus: 'paused' });
      expect(db.ops[0]).toMatchObject({ kind: 'upsert', payload: { status: 'disputed', fulfillment_status: 'paused' } });
      expect(db.ops[1]).toMatchObject({ payload: { status: 'disputed', fulfillment_status: 'paused' } });
      expect(db.ops[1].filters).toContainEqual(['not', 'status', 'in', '(refunded)']);
    });

    it('ignores disputes without a payment intent or for other products', async () => {
      mocks.constructEvent.mockReturnValue(disputeEvent(null));
      expect(await (await POST(request())).json()).toMatchObject({ ignored: 'no_payment_intent' });

      mocks.listSessions.mockResolvedValue({ data: [] });
      mocks.constructEvent.mockReturnValue(disputeEvent());
      expect(await (await POST(request())).json()).toMatchObject({ ignored: 'not_osiris_audit' });
      expect(db.ops).toHaveLength(0);
    });
  });
});
