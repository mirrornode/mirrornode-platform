// app/api/engines/status/route.ts
import { NextResponse } from 'next/server';
import { registry } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = registry.getStatus();

    return NextResponse.json({
      ...status,
      version: "RISING_STAR v1.1.1",
      source: "registry",
      last_heartbeat_ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Status API] Error:', error);
    
    return NextResponse.json({
      active: true,
      status: "error",
      version: "RISING_STAR v1.1.1",
      last_heartbeat_ts: new Date().toISOString(),
      glyphCount: 0,
      numeraetheLoaded: false,
      metrics: { 
        latencyMs: 0, 
        fusedGlyphs: 0 
      },
      lattice: {
        complexity: null,
        bindingStrength: null,
        symbolic_depth: 0,
        nesting_density: 0,
        circular_refs_detected: 0,
        cache_size: 0,
      },
      source: "fallback",
      error: String(error)
    }, { status: 500 });
  }
}