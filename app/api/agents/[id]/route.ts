import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    return NextResponse.json(
      { error: `Agent '${id}' not found in lattice manifest` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    agent,
    timestamp: new Date().toISOString(),
  });
}
