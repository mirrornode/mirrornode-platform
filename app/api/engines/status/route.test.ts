import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/agents", () => ({
  agentList: [
    {
      id: "lucian",
      status: "nominal",
      heartbeat_url: "http://heartbeat.local/lucian",
    },
  ],
}));

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/engines/status", () => {
  it("marks agent as nominal when heartbeat says alive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "alive",
            timestamp: "2026-01-01T00:00:00.000Z",
            symbolic_depth: 7,
          }),
          { status: 200 }
        )
      )
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.agents[0].status).toBe("nominal");
    expect(body.agents[0].symbolic_depth).toBe(7);
  });

  it("falls back to offline when heartbeat fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.agents[0].status).toBe("offline");
    expect(body.agents[0].last_heartbeat_ts).toBeNull();
    expect(body.agents[0].latency_ms).toBeNull();
  });
});
