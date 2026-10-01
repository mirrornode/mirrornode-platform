import { NextResponse } from "next/server";

// Containment: no caller authorization contract exists for this integration.
// Do not forward requests or consume/log submitted payloads until one is reviewed.
export async function POST() {
  return NextResponse.json(
    { error: "Agent requests are temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
