import { describe, expect, it } from "vitest";

import { lanes } from "./lanes";

describe("public lane alignment", () => {
  it("keeps the Agent Stack lane aligned with the reviewed public projection", () => {
    const agentStack = lanes.find((lane) => lane.slug === "agent-stack");
    expect(agentStack?.status).toBe("active");
    expect(agentStack?.exposureState).toBe("reviewed");
    expect(agentStack?.pipeline).toEqual(["Identity", "Function", "Authority", "Public Basis", "Boundary"]);
    expect(agentStack?.body).toContain("source-backed representations");
    expect(agentStack?.body).not.toContain("Held pending canonical manifest review");
  });

  it("keeps the overview sequence consistent with the public process model", () => {
    const overview = lanes.find((lane) => lane.slug === "overview");
    expect(overview?.pipeline).toContain("Routing");
    expect(overview?.pipeline).toContain("Review");
    expect(overview?.pipeline).toContain("Canon");
    expect(overview?.pipeline).toContain("Delivery");
  });
});
