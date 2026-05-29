import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { Pinecone } from '@pinecone-database/pinecone';
import { getStripe } from '@/utils/stripe';

export const runtime = 'nodejs';

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'mirrornode-vault';

async function markVaulted(documentId: string, paidContext: Record<string, string>) {
  if (!pineconeApiKey) {
    console.warn('Pinecone not configured; skipping vault update.');
    return;
  }

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
  const index = pinecone.Index(pineconeIndexName);

  const fetched = await index.fetch({ ids: [documentId] });
  const record = fetched.records?.[documentId];

  if (!record) return;

  await index.upsert({
    records: [
      {
        id: documentId,
        values: record.values ?? [],
        metadata: {
          ...(record.metadata ?? {}),
          vaulted: true,
          paid: true,
          paid_at: new Date().toISOString(),
          stripe_context: JSON.stringify(paidContext),
        },
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headerStore = await headers();
    const signature = headerStore.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
    }

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const documentId = session.metadata?.document_id;

      if (documentId) {
        await markVaulted(documentId, {
          event_type: event.type,
          session_id: session.id,
          payment_status: session.payment_status || 'unknown',
          customer_id: typeof session.customer === 'string' ? session.customer : '',
        });
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const documentId = subscription.metadata?.document_id;

      if (documentId) {
        await markVaulted(documentId, {
          event_type: event.type,
          subscription_id: subscription.id,
          status: subscription.status,
          customer_id:
            typeof subscription.customer === 'string' ? subscription.customer : '',
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 400 });
  }
}
