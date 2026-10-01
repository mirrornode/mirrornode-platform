import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const handler: (request: Request) => Promise<Response> = POST;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/event containment", () => {
  it.each([
    ["anonymous", undefined, JSON.stringify({ prompt: "private prompt", node: "osiris", type: "operator_action", payload: { action: "sync_request" } })],
    ["claimed bearer", "Bearer untrusted", "private malformed body"],
    ["empty request", undefined, ""],
  ])("rejects %s without executing or disclosing input", async (_, authorization, body) => {
    vi.stubEnv("AGENT_BASE_URL", "https://upstream.example.test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const headers = new Headers({ "Content-Type": "application/json" });
    if (authorization) headers.set("Authorization", authorization);
    const request = new Request("https://example.test/api/event", { method: "POST", headers, body });
    const response = await handler(request);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Event submission is temporarily unavailable." });
    expect(request.bodyUsed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
