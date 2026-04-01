/**
 * POST /api/event
 * Receives operator actions and state updates from OSIRIS (or any node).
 * This is the write side of the MIRRORNODE ↔ OSIRIS link.
 *
 * Body shape:
 * {
 *   node: string          // e.g. "osiris"
 *   type: string          // e.g. "operator_action"
 *   payload: object       // action-specific data
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const event = body as Record<string, unknown>;
  const node    = typeof event.node    === 'string' ? event.node    : 'unknown';
  const type    = typeof event.type    === 'string' ? event.type    : 'unknown';
  const payload = typeof event.payload === 'object' ? event.payload : {};

  // Log to console (visible in Vercel function logs)
  console.log(`[Event] node=${node} type=${type}`, payload);

  // Handle known action types
  if (type === 'operator_action') {
    const action = (payload as Record<string, unknown>).action;

    if (action === 'sync_request') {
      // Trigger registry re-init (refreshes lastSync timestamp)
      const status = registry.getStatus();
      return NextResponse.json({
        received: true,
        node,
        type,
        action,
        result: 'sync_acknowledged',
        registry_status: status.status,
        last_sync: status.lastSync,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Generic ack for all other events
  return NextResponse.json({
    received: true,
    node,
    type,
    timestamp: new Date().toISOString(),
  });
}
