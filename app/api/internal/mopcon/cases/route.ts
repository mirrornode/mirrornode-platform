import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { mopconCasesEnv } from '@/lib/env/mopconCases';

export const dynamic = 'force-dynamic';

const AUDIT_FLOW = 'osiris-audit-v1';
const PURCHASE_TABLE = 'guest_audit_purchases';
const ACTIONABLE_PAGE_SIZE = 500;
const TERMINAL_HISTORY_LIMIT = 100;
const ACTIONABLE_FULFILLMENT_STATUSES = [
  'intake_pending',
  'intake_complete',
  'fulfillment_started',
  'paused',
];
const TERMINAL_FULFILLMENT_STATUSES = ['delivered', 'refunded'];
const PROJECTION_FIELDS =
  'id,customer_email,flow,status,fulfillment_status,created_at,updated_at,intake_submitted_at,operator_reviewed_at,fulfillment_started_at,delivered_at,intake_artifact_links';

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
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const actionableRows: PurchaseProjectionRow[] = [];
  let actionableCursor: string | null = null;

  for (;;) {
    let query = supabase
      .from(PURCHASE_TABLE)
      .select(PROJECTION_FIELDS)
      .eq('flow', AUDIT_FLOW)
      .in('fulfillment_status', ACTIONABLE_FULFILLMENT_STATUSES);

    if (actionableCursor) {
      query = query.lt('id', actionableCursor);
    }

    const { data, error } = await query
      .order('id', { ascending: false })
      .limit(ACTIONABLE_PAGE_SIZE);

    if (error) {
      return projectionError(error.message);
    }

    const page = (data ?? []) as PurchaseProjectionRow[];
    actionableRows.push(...page);

    if (page.length < ACTIONABLE_PAGE_SIZE) break;

    const nextCursor = page.at(-1)?.id;
    if (!nextCursor || nextCursor === actionableCursor) {
      return projectionError('Actionable case cursor did not advance.');
    }
    actionableCursor = nextCursor;
  }

  const { data: terminalData, error: terminalError } = await supabase
    .from(PURCHASE_TABLE)
    .select(PROJECTION_FIELDS)
    .eq('flow', AUDIT_FLOW)
    .in('fulfillment_status', TERMINAL_FULFILLMENT_STATUSES)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(TERMINAL_HISTORY_LIMIT);

  if (terminalError) {
    return projectionError(terminalError.message);
  }

  const terminalRows = (terminalData ?? []) as PurchaseProjectionRow[];

  // A case can transition between the actionable and terminal reads. The later
  // terminal read wins for duplicate ids so MOPCON never receives conflicting
  // copies of the same case from this projection response.
  const rowsById = new Map<string, PurchaseProjectionRow>();
  for (const row of actionableRows) rowsById.set(row.id, row);
  for (const row of terminalRows) rowsById.set(row.id, row);

  const rows = [...rowsById.values()].sort(compareRowsNewestFirst);

  return NextResponse.json(
    {
      schema: 'mirrornode.mopcon-case-projection.v0.1',
      generated_at: new Date().toISOString(),
      source: 'mirrornode-platform/guest_audit_purchases',
      projection: 'minimum-operator-case-view',
      mutation: 'disabled',
      coverage: {
        actionable: 'all matching rows, UUID-keyset paged',
        actionable_statuses: ACTIONABLE_FULFILLMENT_STATUSES,
        terminal_history: `latest ${TERMINAL_HISTORY_LIMIT}`,
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
        'All actionable fulfillment rows are retrieved with an immutable UUID keyset cursor; terminal history is bounded to the latest 100 rows.',
        'Duplicate case ids observed across a concurrent status transition are collapsed, preferring the later terminal read.',
        'This endpoint implements GET-only projection logic; fulfillment mutation remains outside this surface.',
      ],
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
