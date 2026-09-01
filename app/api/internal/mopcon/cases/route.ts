import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { mopconCasesEnv } from '@/lib/env/mopconCases';

export const dynamic = 'force-dynamic';

const AUDIT_FLOW = 'osiris-audit-v1';
const PURCHASE_TABLE = 'guest_audit_purchases';
const MAX_CASES = 100;

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function authorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!supplied) return false;

  return timingSafeEqual(
    sha256(supplied),
    sha256(mopconCasesEnv.MOPCON_CASES_READ_SECRET)
  );
}

function maskEmail(value: string | null): string | null {
  if (!value) return null;

  const at = value.indexOf('@');
  if (at <= 0 || at === value.length - 1) return '***';

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${local.slice(0, 1)}***@${domain}`;
}

type PurchaseProjectionRow = {
  id: string;
  customer_email: string | null;
  flow: string | null;
  status: string | null;
  fulfillment_status: string;
  created_at: string | null;
  updated_at: string | null;
  intake_submitted_at: string | null;
  operator_reviewed_at: string | null;
  fulfillment_started_at: string | null;
  delivered_at: string | null;
  intake_artifact_links: unknown;
};

function artifactCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized.' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  const supabase = createClient(
    mopconCasesEnv.SUPABASE_URL,
    mopconCasesEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data, error } = await supabase
    .from(PURCHASE_TABLE)
    .select(
      'id,customer_email,flow,status,fulfillment_status,created_at,updated_at,intake_submitted_at,operator_reviewed_at,fulfillment_started_at,delivered_at,intake_artifact_links'
    )
    .eq('flow', AUDIT_FLOW)
    .order('created_at', { ascending: false })
    .limit(MAX_CASES);

  if (error) {
    console.error('[mopcon-cases] Read-only projection failed:', error.message);
    return NextResponse.json(
      { error: 'Unable to read case projection.' },
      { status: 502, headers: { 'cache-control': 'no-store' } }
    );
  }

  const rows = (data ?? []) as PurchaseProjectionRow[];

  return NextResponse.json(
    {
      schema: 'mirrornode.mopcon-case-projection.v0.1',
      generated_at: new Date().toISOString(),
      source: 'mirrornode-platform/guest_audit_purchases',
      projection: 'minimum-operator-case-view',
      mutation: 'disabled',
      cases: rows.map((row) => ({
        case_id: row.id,
        customer: maskEmail(row.customer_email),
        flow: row.flow,
        payment_status: row.status,
        fulfillment_status: row.fulfillment_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        intake_recorded: Boolean(row.intake_submitted_at),
        intake_submitted_at: row.intake_submitted_at,
        artifact_count: artifactCount(row.intake_artifact_links),
        operator_reviewed_at: row.operator_reviewed_at,
        fulfillment_started_at: row.fulfillment_started_at,
        delivered_at: row.delivered_at,
      })),
      limitations: [
        'This endpoint intentionally omits Stripe identifiers, raw intake text, artifact URLs, and secrets.',
        'The Platform service-role credential remains server-side and is never returned to MOPCON.',
        'This endpoint implements GET-only projection logic; fulfillment mutation remains outside this surface.',
      ],
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
