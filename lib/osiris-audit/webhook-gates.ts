/**
 * Payment-event gates for the Osiris Audit v1 Stripe webhook.
 *
 * These checks restate the existing published offer ($149.00 USD, one unit,
 * payment mode, flow osiris-audit-v1). They do not change price, scope or
 * refund terms. Pure functions: no network, database or clock access.
 */

export const OSIRIS_AUDIT_V1_FLOW = 'osiris-audit-v1';
export const OSIRIS_AUDIT_V1_AMOUNT_MINOR = 14900;
export const OSIRIS_AUDIT_V1_CURRENCY = 'usd';

/** Fulfillment states a partial refund may pause. Later states are left alone. */
export const OSIRIS_AUDIT_V1_PAUSABLE_STATES = [
  'intake_pending',
  'intake_complete',
  'fulfillment_started',
] as const;

/** Live keys must receive live events; test keys must receive test events. */
export function expectedLivemode(secretKey: string): boolean {
  return /^(sk|rk)_live_/.test(secretKey);
}

export type OsirisSessionCheck =
  | { ok: true }
  | {
      ok: false;
      reason: 'NOT_PAYMENT_MODE' | 'CURRENCY_MISMATCH' | 'AMOUNT_MISMATCH';
    };

type CompletedSessionFacts = {
  mode?: string | null;
  currency?: string | null;
  amount_total?: number | null;
};

/**
 * The checkout route sends exactly one Osiris Audit v1 price with no discounts,
 * so a genuine completed session totals the published amount in USD.
 */
export function checkOsirisCompletedSession(
  session: CompletedSessionFacts
): OsirisSessionCheck {
  if (session.mode !== 'payment') {
    return { ok: false, reason: 'NOT_PAYMENT_MODE' };
  }
  if ((session.currency ?? '').toLowerCase() !== OSIRIS_AUDIT_V1_CURRENCY) {
    return { ok: false, reason: 'CURRENCY_MISMATCH' };
  }
  if (session.amount_total !== OSIRIS_AUDIT_V1_AMOUNT_MINOR) {
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  }
  return { ok: true };
}

export type RefundKind = 'full' | 'partial' | 'none';

type RefundedChargeFacts = {
  amount?: number | null;
  amount_refunded?: number | null;
};

export function classifyRefund(charge: RefundedChargeFacts): RefundKind {
  const amount = charge.amount ?? 0;
  const refunded = charge.amount_refunded ?? 0;
  if (amount > 0 && refunded >= amount) return 'full';
  if (refunded > 0) return 'partial';
  return 'none';
}
