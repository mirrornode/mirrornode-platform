/**
 * Writes to the Osiris Audit v1 purchase ledger (guest_audit_purchases).
 *
 * Every write here is a single conditional statement, so a concurrent refund,
 * dispute or fulfillment change committed by another request is never
 * overwritten. The database trigger in
 * supabase/migrations/20261118193000_keep_guest_audit_refunds_monotonic.sql
 * and supabase/migrations/20261119030000_track_guest_audit_dispute_state.sql
 * enforce the refund and dispute rules again at the table, for any other writer.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  OSIRIS_AUDIT_V1_CLOSED_DISPUTE_STATUSES,
  OSIRIS_AUDIT_V1_FLOW,
  OSIRIS_AUDIT_V1_PAUSABLE_STATES,
  OSIRIS_AUDIT_V1_PROTECTED_PAYMENT_STATUSES,
  isDisputeCleared,
} from '@/lib/osiris-audit/webhook-gates';

export const PURCHASE_TABLE = 'guest_audit_purchases';

type DbError = { message: string } | null;

/** PostgREST list literal for `.not(column, 'in', ...)`. Values are internal constants. */
function inList(values: readonly string[]): string {
  return `(${values.join(',')})`;
}

export type OsirisPurchaseFacts = {
  stripe_session_id: string;
  stripe_customer_id: string | null;
  customer_email: string | null;
};

/**
 * Records a payment for a session. A new row is inserted; an existing row only
 * has its payment status updated when that status is not a refund, dispute or
 * review hold. Replays and late intake calls therefore never reopen a refund.
 */
export async function recordOsirisPayment(
  supabase: SupabaseClient,
  facts: OsirisPurchaseFacts,
  status: string,
  now: string
): Promise<{ error: DbError }> {
  const { error: insertError } = await supabase
    .from(PURCHASE_TABLE)
    .upsert(
      { ...facts, flow: OSIRIS_AUDIT_V1_FLOW, status, updated_at: now },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    );
  if (insertError) return { error: insertError };

  const update: Record<string, string> = { status, updated_at: now };
  if (facts.stripe_customer_id) update.stripe_customer_id = facts.stripe_customer_id;
  if (facts.customer_email) update.customer_email = facts.customer_email;

  const { error: updateError } = await supabase
    .from(PURCHASE_TABLE)
    .update(update)
    .eq('stripe_session_id', facts.stripe_session_id)
    .not('status', 'in', inList(OSIRIS_AUDIT_V1_PROTECTED_PAYMENT_STATUSES));

  return { error: updateError ?? null };
}

/**
 * Makes sure a ledger row exists for a session, for events that can arrive
 * before checkout.session.completed (refunds, disputes). Never changes an
 * existing row.
 */
export async function ensureOsirisPurchaseRow(
  supabase: SupabaseClient,
  facts: OsirisPurchaseFacts,
  status: string,
  fulfillmentStatus: 'paused' | 'refunded',
  now: string,
  dispute?: OsirisDisputeFacts
): Promise<{ error: DbError }> {
  const { error } = await supabase
    .from(PURCHASE_TABLE)
    .upsert(
      {
        ...facts,
        flow: OSIRIS_AUDIT_V1_FLOW,
        status,
        fulfillment_status: fulfillmentStatus,
        ...(dispute ?? {}),
        updated_at: now,
      },
      { onConflict: 'stripe_session_id', ignoreDuplicates: true }
    );
  return { error: error ?? null };
}

/** Full refund: terminal for payment and fulfillment, over any earlier state. */
export async function markOsirisRefunded(
  supabase: SupabaseClient,
  sessionId: string,
  now: string
): Promise<{ error: DbError }> {
  const { error } = await supabase
    .from(PURCHASE_TABLE)
    .update({ status: 'refunded', fulfillment_status: 'refunded', updated_at: now })
    .eq('stripe_session_id', sessionId);
  return { error: error ?? null };
}

/**
 * Sets a hold status (partial refund, review) and pauses an active
 * case. Statuses in `keep` are never overwritten, and a refunded case is never
 * touched. Delivered cases keep their fulfillment state; only the payment
 * status is recorded.
 */
export async function holdOsirisCase(
  supabase: SupabaseClient,
  sessionId: string,
  status: string,
  keep: readonly string[],
  now: string
): Promise<{ error: DbError; fulfillmentStatus: string | null }> {
  const { data: paused, error: pauseError } = await supabase
    .from(PURCHASE_TABLE)
    .update({ status, fulfillment_status: 'paused', updated_at: now })
    .eq('stripe_session_id', sessionId)
    .not('status', 'in', inList(keep))
    .in('fulfillment_status', [...OSIRIS_AUDIT_V1_PAUSABLE_STATES])
    .select('fulfillment_status');
  if (pauseError) return { error: pauseError, fulfillmentStatus: null };
  if (paused && paused.length > 0) return { error: null, fulfillmentStatus: 'paused' };

  const { data: recorded, error: recordError } = await supabase
    .from(PURCHASE_TABLE)
    .update({ status, updated_at: now })
    .eq('stripe_session_id', sessionId)
    .not('status', 'in', inList(keep))
    .neq('fulfillment_status', 'refunded')
    .select('fulfillment_status');
  if (recordError) return { error: recordError, fulfillmentStatus: null };

  const after = (recorded?.[0] as { fulfillment_status?: string } | undefined)?.fulfillment_status;
  return { error: null, fulfillmentStatus: after ?? null };
}

export type OsirisDisputeFacts = {
  dispute_id: string;
  dispute_status: string;
};

/** Stripe object ids are letters, digits and underscores; anything else is refused. */
const STRIPE_ID = /^[A-Za-z0-9_]+$/;

/**
 * PostgREST `or` filter for an open-dispute write: no dispute recorded yet, a
 * dispute that is still open, or a different dispute. Only a closed status of
 * the same dispute blocks the write, so a replayed or late `created` or
 * `updated` event can never reopen a dispute that Stripe has closed.
 */
function disputeNotClosed(disputeId: string): string {
  return [
    'dispute_status.is.null',
    `dispute_status.not.in.${inList(OSIRIS_AUDIT_V1_CLOSED_DISPUTE_STATUSES)}`,
    'dispute_id.is.null',
    `dispute_id.neq.${disputeId}`,
  ].join(',');
}

/**
 * Records an open dispute in `dispute_status`, separately from the refund
 * state in `status`, and pauses an active case. Never overwrites a closed
 * status of the same dispute, so a late `created` or `updated` event cannot
 * reopen it.
 */
export async function recordOsirisDisputeOpen(
  supabase: SupabaseClient,
  sessionId: string,
  dispute: OsirisDisputeFacts,
  now: string
): Promise<{ error: DbError; fulfillmentStatus: string | null }> {
  if (!STRIPE_ID.test(dispute.dispute_id)) {
    return { error: { message: 'Unexpected dispute id format' }, fulfillmentStatus: null };
  }
  const guard = disputeNotClosed(dispute.dispute_id);
  const { data: paused, error: pauseError } = await supabase
    .from(PURCHASE_TABLE)
    .update({ ...dispute, fulfillment_status: 'paused', updated_at: now })
    .eq('stripe_session_id', sessionId)
    .or(guard)
    .in('fulfillment_status', [...OSIRIS_AUDIT_V1_PAUSABLE_STATES])
    .select('fulfillment_status');
  if (pauseError) return { error: pauseError, fulfillmentStatus: null };
  if (paused && paused.length > 0) return { error: null, fulfillmentStatus: 'paused' };

  const { data: recorded, error: recordError } = await supabase
    .from(PURCHASE_TABLE)
    .update({ ...dispute, updated_at: now })
    .eq('stripe_session_id', sessionId)
    .or(guard)
    .select('fulfillment_status');
  if (recordError) return { error: recordError, fulfillmentStatus: null };

  const after = (recorded?.[0] as { fulfillment_status?: string } | undefined)?.fulfillment_status;
  return { error: null, fulfillmentStatus: after ?? null };
}

/**
 * Records a closed dispute. A closed status is final in Stripe, so the dispute
 * fields are written unconditionally. A dispute closed in the merchant's
 * favour (won, inquiry closed) never changes fulfillment: a paused case stays
 * paused until the Operator decides. A lost or prevented dispute also pauses an
 * active case, in case its earlier open event never arrived.
 */
export async function recordOsirisDisputeClosed(
  supabase: SupabaseClient,
  sessionId: string,
  dispute: OsirisDisputeFacts,
  now: string
): Promise<{ error: DbError; fulfillmentStatus: string | null }> {
  if (!isDisputeCleared(dispute.dispute_status)) {
    const { data: paused, error: pauseError } = await supabase
      .from(PURCHASE_TABLE)
      .update({ ...dispute, fulfillment_status: 'paused', updated_at: now })
      .eq('stripe_session_id', sessionId)
      .in('fulfillment_status', [...OSIRIS_AUDIT_V1_PAUSABLE_STATES])
      .select('fulfillment_status');
    if (pauseError) return { error: pauseError, fulfillmentStatus: null };
    if (paused && paused.length > 0) return { error: null, fulfillmentStatus: 'paused' };
  }

  const { data, error } = await supabase
    .from(PURCHASE_TABLE)
    .update({ ...dispute, updated_at: now })
    .eq('stripe_session_id', sessionId)
    .select('fulfillment_status');
  if (error) return { error, fulfillmentStatus: null };
  const after = (data?.[0] as { fulfillment_status?: string } | undefined)?.fulfillment_status;
  return { error: null, fulfillmentStatus: after ?? null };
}
