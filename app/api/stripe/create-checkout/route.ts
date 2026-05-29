import { NextResponse } from 'next/server';
import { getStripe } from '@/utils/stripe';
import { getUserFromBearer } from '@/utils/supabase/server';

type Body = {
  documentId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  quote: number;
  checkoutTier: 'tier1' | 'tier2' | 'tier3';
  mode?: 'payment' | 'subscription';
};

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getUserFromBearer(req);

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const { documentId, severity, quote, checkoutTier, mode = 'payment' } = body;

    if (!documentId || !quote || !checkoutTier) {
      return NextResponse.json({ error: 'Missing checkout payload.' }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/librarian?canceled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: quote * 100,
            product_data: {
              name: `MIRRORNODE ${checkoutTier.toUpperCase()} Audit`,
              description: `Severity ${severity} document audit routed through Librarian`,
            },
          },
        },
      ],
      metadata: {
        user_id: user.id,
        document_id: documentId,
        severity,
        checkout_tier: checkoutTier,
        quote: String(quote),
        flow: 'librarian-audit',
      },
      customer_email: user.email,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json({ error: 'Unable to create checkout session.' }, { status: 500 });
  }
}
