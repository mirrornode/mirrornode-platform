import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { mopconCasesEnv } from '@/lib/env/mopconCases';

export const dynamic = 'force-dynamic';

const SNAPSHOT_RPC = 'mopcon_case_projection';
const ACTIONABLE_FULFILLMENT_STATUSES = [
  'intake_pending',
  'intake_complete',
  'fulfillment_started',
  'paused',
];
const TERMINAL_FULFILLMENT_STATUSES = ['delivered', 'refunded'];
const TERMINAL_HISTORY_LIMIT = 100;

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
  return `${value.slice(0, 1)}***@${value.slice(at + 1)}`;
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

function createdAtMillis(row: PurchaseProjectionRow): number {
  if (!row.created_at) return 0;
  const value = Date.parse(row.created_at);
  return Number.isNaN(value) ? 0 : value;
}

function compareRowsNewestFirst(a: PurchaseProjectionRow, b: PurchaseProjectionRow): number {
  const timeDelta = createdAtMillis(b) - createdAtMillis(a);
  return timeDelta !== 0 ? timeDelta : b.id.localeCompare(a.id);
}

function projectionError(message: string): Response {
  console.error('[mopcon-cases] Read-only projection failed:', message);
  return NextResponse.json(
    { error: 'Unable to read case projection.' },
    { status: 502, headers: { 'cache-control': 'no-store' } }
  );
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
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabase.rpc(SNAPSHOT_RPC);
  if (error) return projectionError(error.message);

  const rows = ((data ?? []) as PurchaseProjectionRow[]).sort(compareRowsNewestFirst);

  return NextResponse.json(
    {
      schema: 'mirrornode.mopcon-case-projection.v0.1',
      generated_at: new Date().toISOString(),
      source: 'mirrornode-platform/guest_audit_purchases',
      projection: 'minimum-operator-case-view',
      mutation: 'disabled',
      coverage: {
        actionable: 'all matching rows from one PostgreSQL statement snapshot',
        actionable_statuses: ACTIONABLE_FULFILLMENT_STATUSES,
        terminal_history: `latest ${TERMINAL_HISTORY_LIMIT} from the same snapshot`,
        terminal_statuses: TERMINAL_FULFILLMENT_STATUSES,
      },
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
        'Actionable cases and bounded terminal history are selected inside one PostgreSQL statement snapshot; the route performs no client-side pagination or status-race reconciliation.',
        'This endpoint implements GET-only projection logic; fulfillment mutation remains outside this surface.',
      ],
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
