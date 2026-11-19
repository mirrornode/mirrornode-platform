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

/** Fulfillment states a refund, dispute or review hold may pause. Later states are left alone. */
export const OSIRIS_AUDIT_V1_PAUSABLE_STATES = [
  'intake_pending',
  'intake_complete',
  'fulfillment_started',
] as const;

/** Live keys must receive live events; test keys must receive test events. */
export function expectedLivemode(secretKey: string): boolean {
  return /^(sk|rk)_live_/.test(secretKey);
}

/**
 * Payment statuses that record money moving back, or a case held for review.
 * A replayed payment event or an intake call must never overwrite them with
 * Stripe's checkout `payment_status`, which stays `paid` after a refund.
 * Disputes are tracked separately, in `dispute_status`, so a dispute and a
 * refund on the same payment are both visible.
 */
export const OSIRIS_AUDIT_V1_PROTECTED_PAYMENT_STATUSES = [
  'refunded',
  'partially_refunded',
  'needs_review',
] as const;

/**
 * Stripe dispute statuses that are final. A closed dispute never reopens, so
 * a late or replayed event carrying an open status must not overwrite one.
 * `warning_closed` ends an inquiry without a chargeback; `prevented` means
 * the dispute was stopped before it became a chargeback.
 */
export const OSIRIS_AUDIT_V1_CLOSED_DISPUTE_STATUSES = [
  'won',
  'lost',
  'warning_closed',
  'prevented',
] as const;

/**
 * Closed dispute statuses that leave a payment standing. Any other recorded
 * dispute (open, lost or prevented) keeps intake and fulfillment start closed.
 */
export const OSIRIS_AUDIT_V1_CLEARED_DISPUTE_STATUSES = ['won', 'warning_closed'] as const;

/** PostgREST `or` filter: no dispute recorded, or one that closed in the merchant's favour. */
export const OSIRIS_DISPUTE_ALLOWS_INTAKE = `dispute_status.is.null,dispute_status.in.(${OSIRIS_AUDIT_V1_CLEARED_DISPUTE_STATUSES.join(',')})`;

export function isDisputeClosed(status: string | null | undefined): boolean {
  return (OSIRIS_AUDIT_V1_CLOSED_DISPUTE_STATUSES as readonly string[]).includes(status ?? '');
}

export type OsirisSessionMismatch =
  | 'NOT_PAYMENT_MODE'
  | 'CURRENCY_MISMATCH'
  | 'AMOUNT_MISMATCH'
  | 'PRICE_MISMATCH';

export type OsirisSessionCheck =
  | { ok: true }
  | { ok: false; reason: OsirisSessionMismatch };

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

type LineItemFacts = {
  quantity?: number | null;
  price?: { id?: string | null } | null;
};

/**
 * The checkout route sells one unit of the configured audit price. This is the
 * same rule the intake route has always applied, shared so the two cannot drift.
 */
export function hasCanonicalAuditLineItem(
  lineItems: readonly LineItemFacts[] | null | undefined,
  auditPriceId: string
): boolean {
  return (
    lineItems?.some(
      (item) => item.price?.id === auditPriceId && item.quantity === 1
    ) ?? false
  );
}

/**
 * Full offer check used by both the webhook and the intake route: payment mode,
 * USD, the published total, and the canonical price at quantity one.
 */
export function checkOsirisOffer(
  session: CompletedSessionFacts,
  lineItems: readonly LineItemFacts[] | null | undefined,
  auditPriceId: string
): OsirisSessionCheck {
  const facts = checkOsirisCompletedSession(session);
  if (!facts.ok) return facts;
  if (!hasCanonicalAuditLineItem(lineItems, auditPriceId)) {
    return { ok: false, reason: 'PRICE_MISMATCH' };
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

/** True for a closed dispute that leaves the payment standing (won, inquiry closed). */
export function isDisputeCleared(status: string | null | undefined): boolean {
  return (OSIRIS_AUDIT_V1_CLEARED_DISPUTE_STATUSES as readonly string[]).includes(status ?? '');
}
