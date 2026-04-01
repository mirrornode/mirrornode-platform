/**
 * GET /api/engines/status
 * Returns live telemetry for all agents in the manifest.
 *
 * This is the primary data source for the /agents Situation Room UI.
 * Fields:
 *   - status:             current operational status
 *   - last_heartbeat_ts: ISO timestamp of last known heartbeat
 *   - symbolic_depth:    current recursion depth in Fusion Engine lattice (0-8)
 *   - latency_ms:        last response latency in milliseconds
 *
 * Stub: returns manifest-seeded values until real instrumentation is wired.
 * Replace the stub block below with Redis/Upstash reads when PERSISTENCE_UPGRADE lands.
 */

import { NextResponse } from "next/server";
import { agentList } from "@/lib/agents";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();

  // ---------------------------------------------------------------------------
  // STUB — replace with real telemetry store reads (Upstash/Redis)
  // ---------------------------------------------------------------------------
  const agents = agentList.map((agent) => ({
    id:                 agent.id,
    status:             agent.status,
    last_heartbeat_ts:  now,          // stub: real value comes from heartbeat writes
    symbolic_depth:     0,            // stub: real value comes from Fusion Engine state
    latency_ms:         null,         // stub: real value comes from agent ping
  }));
  // ---------------------------------------------------------------------------

  return NextResponse.json({
    agents,
    updated_at: now,
  });
}
