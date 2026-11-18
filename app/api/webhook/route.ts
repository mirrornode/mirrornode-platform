import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { stripeEnv } from '@/lib/env/stripe';
import {
  OSIRIS_AUDIT_V1_FLOW,
  OSIRIS_AUDIT_V1_PAUSABLE_STATES,
  checkOsirisCompletedSession,
  classifyRefund,
  expectedLivemode,
} from '@/lib/osiris-audit/webhook-gates';

const PURCHASE_TABLE = 'guest_audit_purchases';

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
      const check = checkOsirisCompletedSession(session);
      if (!check.ok) {
        console.warn('[webhook] Osiris session does not match the published offer:', session.id, check.reason);
        return NextResponse.json({ received: true, ignored: 'offer_mismatch' });
      }

      const { error } = await supabase
        .from(PURCHASE_TABLE)
        .upsert(
          {
            stripe_customer_id:
              typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email ?? null,
            flow,
            status: session.payment_status || session.status || 'completed',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_session_id' }
        );

      if (error) {
        console.error('[webhook] Guest audit purchase upsert error:', error.message);
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
      }
    }
  }

  if (event.type === 'charge.refunded') {
    return handleOsirisRefund(stripe, supabase, event.data.object as Stripe.Charge);
  }

  return NextResponse.json({ received: true });
}

/**
 * A refund does not change a Checkout Session's payment_status, so without
 * this handler a refunded session would still pass intake and fulfillment start.
 * Full refund: the case becomes `refunded`, which intake and the start RPC refuse.
 * Partial refund: an active case is paused for the operator to decide.
 */
async function handleOsirisRefund(
  stripe: Stripe,
  supabase: SupabaseClient,
  charge: Stripe.Charge
) {
  const kind = classifyRefund(charge);
  const paymentIntent =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (kind === 'none' || !paymentIntent) {
    return NextResponse.json({ received: true, ignored: 'no_refund_or_payment_intent' });
  }

  let sessionId: string;
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent,
      limit: 1,
    });
    const session = sessions.data[0];
    if (!session || session.metadata?.flow !== OSIRIS_AUDIT_V1_FLOW) {
      return NextResponse.json({ received: true, ignored: 'not_osiris_audit' });
    }
    sessionId = session.id;
  } catch {
    console.error('[webhook] Could not look up the session for a refund:', charge.id);
    return NextResponse.json({ error: 'Session lookup failed' }, { status: 500 });
  }

  const { data: existing, error: readError } = await supabase
    .from(PURCHASE_TABLE)
    .select('fulfillment_status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (readError) {
    console.error('[webhook] Refund read error:', readError.message);
    return NextResponse.json({ error: 'DB read failed' }, { status: 500 });
  }

  if (!existing) {
    // The purchase row is written on checkout.session.completed. Ask Stripe to
    // retry so a refund that arrives first is still applied.
    return NextResponse.json({ error: 'Purchase not recorded yet' }, { status: 500 });
  }

  const currentState = (existing as { fulfillment_status: string }).fulfillment_status;
  const update: Record<string, string> = {
    status: kind === 'full' ? 'refunded' : 'partially_refunded',
    updated_at: new Date().toISOString(),
  };
  if (kind === 'full') {
    update.fulfillment_status = 'refunded';
  } else if ((OSIRIS_AUDIT_V1_PAUSABLE_STATES as readonly string[]).includes(currentState)) {
    update.fulfillment_status = 'paused';
  }

  const { error: updateError } = await supabase
    .from(PURCHASE_TABLE)
    .update(update)
    .eq('stripe_session_id', sessionId);

  if (updateError) {
    console.error('[webhook] Refund update error:', updateError.message);
    return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
  }

  return NextResponse.json({
    received: true,
    refund: kind,
    fulfillmentStatus: update.fulfillment_status ?? currentState,
  });
}
