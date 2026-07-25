import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { stripeEnv } from '@/lib/env/stripe';
import { osirisAuditIntakeSchema } from '@/lib/osiris-audit/intake';

export const dynamic = 'force-dynamic';

const PURCHASE_TABLE = 'guest_audit_purchases';
const AUDIT_FLOW = 'osiris-audit-v1';

export async function POST(req: NextRequest) {
  let parsed: ReturnType<typeof osirisAuditIntakeSchema.safeParse>;

  try {
    parsed = osirisAuditIntakeSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid intake', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    sessionId,
    systemSummary,
    primaryGoal,
    concerns,
    artifactLinks,
    additionalContext,
  } = parsed.data;

  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia',
  });

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json(
      { error: 'Unable to verify this checkout session' },
      { status: 403 }
    );
  }

  if (
    session.metadata?.flow !== AUDIT_FLOW ||
    session.payment_status !== 'paid'
  ) {
    return NextResponse.json(
      { error: 'This session is not a paid Osiris Audit v1 purchase' },
      { status: 403 }
    );
  }

  const supabase = createClient(
    stripeEnv.SUPABASE_URL,
    stripeEnv.SUPABASE_SERVICE_ROLE_KEY
  );
  const now = new Date().toISOString();

  // Preserve payment evidence even when the success redirect wins the race
  // against Stripe's webhook. Fulfillment columns are intentionally omitted
  // so database defaults and any later Operator state are not overwritten.
  const { error: paymentError } = await supabase
    .from(PURCHASE_TABLE)
    .upsert(
      {
        stripe_customer_id:
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null,
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email ?? null,
        flow: AUDIT_FLOW,
        status: session.payment_status || session.status || 'completed',
        updated_at: now,
      },
      { onConflict: 'stripe_session_id' }
    );

  if (paymentError) {
    console.error('[osiris-intake] Payment reconciliation failed:', paymentError.message);
    return NextResponse.json(
      { error: 'Unable to preserve purchase evidence' },
      { status: 500 }
    );
  }

  // The database predicate makes duplicate or out-of-order submissions
  // deterministic: only an intake_pending row with no prior submission moves.
  const { data: updatedRows, error: intakeError } = await supabase
    .from(PURCHASE_TABLE)
    .update({
      intake_system_summary: systemSummary,
      intake_primary_goal: primaryGoal,
      intake_concerns: concerns,
      intake_artifact_links: artifactLinks,
      intake_additional_context: additionalContext || null,
      intake_submitted_at: now,
      fulfillment_status: 'intake_complete',
      updated_at: now,
    })
    .eq('stripe_session_id', session.id)
    .eq('fulfillment_status', 'intake_pending')
    .is('intake_submitted_at', null)
    .select('stripe_session_id');

  if (intakeError) {
    console.error('[osiris-intake] Intake persistence failed:', intakeError.message);
    return NextResponse.json(
      { error: 'Unable to save intake' },
      { status: 500 }
    );
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: 'Intake was already submitted or fulfillment has already advanced' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    accepted: true,
    fulfillmentStatus: 'intake_complete',
  });
}
