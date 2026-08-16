import { describe, expect, it } from "vitest";

import { lanes } from "./lanes";

describe("public lane alignment", () => {
  it("keeps the selected node map aligned with the reviewed public projection", () => {
    const nodeMap = lanes.find((lane) => lane.slug === "agent-stack");
    expect(nodeMap?.title).toBe("Public Node Map");
    expect(nodeMap?.status).toBe("active");
    expect(nodeMap?.exposureState).toBe("reviewed");
    expect(nodeMap?.pipeline).toEqual(["Identity", "Function", "Authority", "Public Basis", "Boundary"]);
    expect(nodeMap?.body).toContain("selected source-backed representations");
    expect(nodeMap?.body).toContain("not a claim of the complete Agent Stack");
    expect(nodeMap?.body).not.toContain("Held pending canonical manifest review");
  });

  it("keeps the overview sequence consistent with the public process model", () => {
    const overview = lanes.find((lane) => lane.slug === "overview");
    expect(overview?.pipeline).toContain("Routing");
    expect(overview?.pipeline).toContain("Review");
    expect(overview?.pipeline).toContain("Canon");
    expect(overview?.pipeline).toContain("Delivery");
  });
});
