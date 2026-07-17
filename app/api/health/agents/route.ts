import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const agentBaseUrl = process.env.AGENT_BASE_URL;

  if (!agentBaseUrl) {
    return NextResponse.json({
      status: "unconfigured",
      service: "agents",
      missing: ["AGENT_BASE_URL"],
    });
  }

  try {
    const response = await fetch(new URL("/health", agentBaseUrl), {
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      return NextResponse.json({
        status: "degraded",
        service: "agents",
        runtime_status: response.status,
      });
    }

    const runtime = await response.json();

    return NextResponse.json({
      status: "configured",
      service: "agents",
      runtime,
    });
  } catch {
    return NextResponse.json({
      status: "offline",
      service: "agents",
    });
  }
}
