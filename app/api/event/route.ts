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
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const eventSchema = z.object({
  node: z.string().trim().min(1, 'node is required'),
  type: z.string().trim().min(1, 'type is required'),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  let event: z.infer<typeof eventSchema>;

  try {
    const body = await req.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }
    event = result.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const { node, type, payload } = event;

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
