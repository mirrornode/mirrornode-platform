import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/agent", () => {
  it("returns 400 for invalid body", async () => {
    const req = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "" }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(400);
  });

  it("returns 500 when AGENT_BASE_URL is not set", async () => {
    vi.stubEnv("AGENT_BASE_URL", "");
    const req = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "ping" }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(500);
  });

  it("maps upstream 5xx to 502", async () => {
    vi.stubEnv("AGENT_BASE_URL", "http://upstream.local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream failed", { status: 503 }))
    );
    const req = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "ping" }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("Agent upstream request failed");
    expect(body.upstream_status).toBe(503);
  });

  it("maps fetch timeout failures to 504", async () => {
    vi.stubEnv("AGENT_BASE_URL", "http://upstream.local");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const req = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "ping" }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(504);
    expect(body.error).toBe("Agent request failed");
  });
});
