import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { stripeEnv } from '@/lib/env/stripe';
import {
  OSIRIS_AUDIT_V1_FLOW,
  checkOsirisCompletedSession,
  checkOsirisOffer,
  classifyRefund,
  expectedLivemode,
  isDisputeClosed,
} from '@/lib/osiris-audit/webhook-gates';
import {
  ensureOsirisPurchaseRow,
  holdOsirisCase,
  markOsirisRefunded,
  recordOsirisDisputeClosed,
  recordOsirisDisputeOpen,
  recordOsirisPayment,
  type OsirisPurchaseFacts,
} from '@/lib/osiris-audit/purchase-ledger';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia',
  });

  const supabase = createClient(
    stripeEnv.SUPABASE_URL,
    stripeEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      stripeEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    // Do not echo verification details back to the caller.
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // A live key must only act on live events, and a test key on test events.
  // Acknowledge (200) so Stripe does not retry an event this deployment must ignore.
  if (event.livemode !== expectedLivemode(stripeEnv.STRIPE_SECRET_KEY)) {
    console.warn('[webhook] Ignored event from the other Stripe mode:', event.id);
    return NextResponse.json({ received: true, ignored: 'livemode_mismatch' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const flow = session.metadata?.flow;

    if (userId) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_session_id: session.id,
          status: 'active',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[webhook] Supabase upsert error:', error.message);
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
      }
    } else if (flow === OSIRIS_AUDIT_V1_FLOW) {
      return handleOsirisCompleted(stripe, supabase, session);
    }
  }

  if (event.type === 'charge.refunded') {
    return handleOsirisRefund(stripe, supabase, event.data.object as Stripe.Charge);
  }

  if (
    event.type === 'charge.dispute.created' ||
    event.type === 'charge.dispute.updated' ||
    event.type === 'charge.dispute.closed'
  ) {
    return handleOsirisDispute(stripe, supabase, event.data.object as Stripe.Dispute);
  }

  return NextResponse.json({ received: true });
}

function purchaseFacts(session: Stripe.Checkout.Session): OsirisPurchaseFacts {
  return {
    stripe_session_id: session.id,
    stripe_customer_id:
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    customer_email: session.customer_details?.email ?? null,
  };
}

function idOf(ref: string | { id: string } | null | undefined): string | null {
  return typeof ref === 'string' ? ref : ref?.id ?? null;
}

function dbFailure(context: string, message: string) {
  console.error(`[webhook] ${context}:`, message);
  return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
}

/**
 * A paid Osiris session is recorded only when it matches the published offer
 * (mode, USD, $149.00 total, canonical price at quantity one), the same check
 * the intake route applies. A session that does not match is still recorded,
 * as `needs_review` with fulfillment paused, so a real payment is never
 * dropped silently and cannot proceed without the Operator.
 */
async function handleOsirisCompleted(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  let check = checkOsirisCompletedSession(session);
  if (check.ok) {
    try {
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      check = checkOsirisOffer(session, items.data, stripeEnv.STRIPE_AUDIT_PRICE_ID);
    } catch {
      console.error('[webhook] Could not read line items for session:', session.id);
      return NextResponse.json({ error: 'Line item lookup failed' }, { status: 500 });
    }
  }

  const facts = purchaseFacts(session);
  const now = new Date().toISOString();

  if (!check.ok) {
    console.warn('[webhook] Osiris session held for review:', session.id, check.reason);
    const ensured = await ensureOsirisPurchaseRow(supabase, facts, 'needs_review', 'paused', now);
    if (ensured.error) return dbFailure('Review hold insert error', ensured.error.message);
    const held = await holdOsirisCase(
      supabase,
      session.id,
      'needs_review',
      ['refunded', 'partially_refunded'],
      now
    );
    if (held.error) return dbFailure('Review hold update error', held.error.message);
    return NextResponse.json({ received: true, review: 'offer_mismatch', reason: check.reason });
  }

  const { error } = await recordOsirisPayment(
    supabase,
    facts,
    session.payment_status || session.status || 'completed',
    now
  );
  if (error) return dbFailure('Guest audit purchase upsert error', error.message);
  return NextResponse.json({ received: true });
}

/** Finds the Osiris checkout session behind a payment intent, or null if it is not one. */
async function findOsirisSession(
  stripe: Stripe,
  paymentIntent: string
): Promise<Stripe.Checkout.Session | null> {
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
  const session = sessions.data[0];
  if (!session || session.metadata?.flow !== OSIRIS_AUDIT_V1_FLOW) return null;
  return session;
}

/**
 * A refund does not change a Checkout Session's payment_status, so without
 * this handler a refunded session would still pass intake and fulfillment start.
 * Full refund: the case becomes `refunded`, which intake and the start RPC refuse.
 * Partial refund: an active case is paused for the operator to decide.
 * A refund that arrives before checkout.session.completed creates the row in
 * its refunded state, so the later payment event cannot reopen it and Stripe
 * is not left retrying for days.
 */
async function handleOsirisRefund(
  stripe: Stripe,
  supabase: SupabaseClient,
  charge: Stripe.Charge
) {
  const kind = classifyRefund(charge);
  const paymentIntent = idOf(charge.payment_intent);

  if (kind === 'none' || !paymentIntent) {
    return NextResponse.json({ received: true, ignored: 'no_refund_or_payment_intent' });
  }

  let session: Stripe.Checkout.Session | null;
  try {
    session = await findOsirisSession(stripe, paymentIntent);
  } catch {
    console.error('[webhook] Could not look up the session for a refund:', charge.id);
    return NextResponse.json({ error: 'Session lookup failed' }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ received: true, ignored: 'not_osiris_audit' });
  }

  const now = new Date().toISOString();
  const facts = purchaseFacts(session);

  if (kind === 'full') {
    const ensured = await ensureOsirisPurchaseRow(supabase, facts, 'refunded', 'refunded', now);
    if (ensured.error) return dbFailure('Refund insert error', ensured.error.message);
    // Terminal: a full refund wins over any other state, including delivered.
    const { error } = await markOsirisRefunded(supabase, session.id, now);
    if (error) return dbFailure('Refund update error', error.message);
    return NextResponse.json({ received: true, refund: kind, fulfillmentStatus: 'refunded' });
  }

  const ensured = await ensureOsirisPurchaseRow(supabase, facts, 'partially_refunded', 'paused', now);
  if (ensured.error) return dbFailure('Refund insert error', ensured.error.message);
  const held = await holdOsirisCase(supabase, session.id, 'partially_refunded', ['refunded'], now);
  if (held.error) return dbFailure('Refund update error', held.error.message);
  return NextResponse.json({ received: true, refund: kind, fulfillmentStatus: held.fulfillmentStatus });
}

/**
 * Dispute state is tracked in `dispute_id` and `dispute_status`, separately
 * from the refund state in `status`, so a dispute stays visible when the same
 * payment is also partly or fully refunded.
 *
 * An open dispute (created, or updated to any open status) pauses an active
 * case; the fulfillment start RPC also refuses a case with an open or lost
 * dispute. A closed dispute is recorded but never unpauses the case: resuming
 * is the Operator's decision. A lost or prevented dispute also pauses an
 * active case. Events can
 * arrive in any order; a closed status is never overwritten by a late open one.
 */
async function handleOsirisDispute(
  stripe: Stripe,
  supabase: SupabaseClient,
  dispute: Stripe.Dispute
) {
  const paymentIntent = idOf(dispute.payment_intent);
  if (!paymentIntent) {
    return NextResponse.json({ received: true, ignored: 'no_payment_intent' });
  }

  let session: Stripe.Checkout.Session | null;
  try {
    session = await findOsirisSession(stripe, paymentIntent);
  } catch {
    console.error('[webhook] Could not look up the session for a dispute:', dispute.id);
    return NextResponse.json({ error: 'Session lookup failed' }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ received: true, ignored: 'not_osiris_audit' });
  }

  const now = new Date().toISOString();
  const disputeFacts = { dispute_id: dispute.id, dispute_status: dispute.status };
  const closed = isDisputeClosed(dispute.status);

  // A dispute can arrive before checkout.session.completed. The row is created
  // paused with the dispute recorded; the payment event then fills in `paid`
  // without touching the dispute columns or the pause.
  const ensured = await ensureOsirisPurchaseRow(
    supabase,
    purchaseFacts(session),
    session.payment_status === 'paid' ? 'paid' : 'needs_review',
    'paused',
    now,
    disputeFacts
  );
  if (ensured.error) return dbFailure('Dispute insert error', ensured.error.message);

  const written = closed
    ? await recordOsirisDisputeClosed(supabase, session.id, disputeFacts, now)
    : await recordOsirisDisputeOpen(supabase, session.id, disputeFacts, now);
  if (written.error) return dbFailure('Dispute update error', written.error.message);

  return NextResponse.json({
    received: true,
    dispute: closed ? 'closed' : 'open',
    disputeStatus: dispute.status,
    fulfillmentStatus: written.fulfillmentStatus,
  });
}
