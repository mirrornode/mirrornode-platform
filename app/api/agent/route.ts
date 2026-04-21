import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const agentRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required"),
});

export async function POST(req: NextRequest) {
  let parsedBody: z.infer<typeof agentRequestSchema>;

  try {
    const json = await req.json();
    const result = agentRequestSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 }
      );
    }
    parsedBody = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const agentBaseUrl = process.env.AGENT_BASE_URL;
  if (!agentBaseUrl) {
    return NextResponse.json(
      { error: "AGENT_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(new URL("/agent", agentBaseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: parsedBody.prompt }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const upstreamText = await response.text();
      return NextResponse.json(
        {
          error: "Agent upstream request failed",
          upstream_status: response.status,
          upstream_body: upstreamText || null,
        },
        { status: response.status >= 500 ? 502 : 400 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Agent request failed" },
      { status: 504 }
    );
  }
}
