import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/registry", () => ({
  registry: {
    getStatus: () => ({
      status: "ok",
      lastSync: "2026-01-01T00:00:00.000Z",
    }),
  },
}));

import { POST } from "./route";

describe("POST /api/event", () => {
  it("returns 400 for invalid payload shape", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: "", type: "operator_action", payload: {} }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("acknowledges sync_request events", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node: "osiris",
        type: "operator_action",
        payload: { action: "sync_request" },
      }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.result).toBe("sync_acknowledged");
  });

  it("returns generic ack for non-operator events", async () => {
    const req = new Request("http://localhost/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node: "hermes",
        type: "health_ping",
        payload: { uptime: 123 },
      }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.type).toBe("health_ping");
    expect(body.result).toBeUndefined();
  });
});
