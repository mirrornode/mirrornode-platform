import { NextResponse } from "next/server";
import { agentList } from "@/lib/agents";

export async function GET() {
  return NextResponse.json({
    agents: agentList,
    count: agentList.length,
    timestamp: new Date().toISOString(),
  });
}
