/**
 * GET /api/state/osiris
 * Returns current MIRRORNODE state for OSIRIS node consumption.
 * This is the read side of the MIRRORNODE ↔ OSIRIS link.
 */

import { NextResponse } from 'next/server';
import { registry } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = registry.getStatus();

  return NextResponse.json({
    node: 'osiris',
    status: 'active',
    last_sync: status.lastSync,
    version: status.version,
    glyphCount: status.glyphCount,
    numeraetheLoaded: status.numeraetheLoaded,
    lattice: status.lattice,
    directives: [],
    _meta: {
      source: 'mirrornode-platform',
      endpoint: '/api/state/osiris',
      timestamp: new Date().toISOString(),
    },
  });
}
