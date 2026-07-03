import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeEnv } from '@/lib/env/stripe';

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    });

    const priceId = stripeEnv.STRIPE_AUDIT_PRICE_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const body = (await req.json().catch(() => ({}))) as { cancelPath?: string };
    const cancelPath =
      typeof body.cancelPath === 'string' && body.cancelPath.startsWith('/')
        ? body.cancelPath
        : '/audit?canceled=1';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        flow: 'osiris-audit-v1',
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
