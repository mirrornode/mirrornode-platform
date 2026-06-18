import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripeEnv } from '@/lib/env/stripe';

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
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
    } else if (flow === 'osiris-audit-v1') {
      const { error } = await supabase
        .from('guest_audit_purchases')
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

  return NextResponse.json({ received: true });
}
