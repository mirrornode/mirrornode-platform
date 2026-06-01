import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeEnv } from '@/lib/env/stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia',
  });

  try {
    const body = await req.json();
    const { priceId, userId } = body as { priceId: string; userId: string };

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'priceId and userId are required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
