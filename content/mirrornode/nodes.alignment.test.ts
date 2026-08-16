import { describe, expect, it } from "vitest";

import { surfaceNodes } from "./nodes";

describe("public node language alignment", () => {
  it("keeps Merlin advisory rather than execution-bearing", () => {
    const merlin = surfaceNodes.find((node) => node.id === "merlin");
    expect(merlin?.summary.toLowerCase()).toContain("planning");
    expect(merlin?.authoritySummary).toContain("does not grant approval");
    expect(merlin?.authoritySummary).toContain("execution authority");
  });

  it("presents Theia as an integration/coherence lane without manufacturing authority", () => {
    const theia = surfaceNodes.find((node) => node.id === "theia");
    expect(theia?.functionSummary).toContain("Architectural integration");
    expect(theia?.authoritySummary).toContain("does not create authority");
  });

  it("presents Thoth as security and authority-boundary review", () => {
    const thoth = surfaceNodes.find((node) => node.id === "thoth");
    expect(thoth?.summary).toContain("Security and authority-boundary review");
    expect(thoth?.authoritySummary).toContain("does not itself authorize execution");
  });

  it("fails Librarian placement closed while reconciliation remains open", () => {
    const librarian = surfaceNodes.find((node) => node.id === "librarian");
    expect(librarian?.nodeType).toBe("reference");
    expect(librarian?.exposureState).toBe("deferred");
    expect(librarian?.authoritySummary).toContain("placement remains unresolved");
  });

  it("does not encode displayed-map membership as a complete registry claim", () => {
    expect(surfaceNodes.some((node) => node.id === "core-hub")).toBe(true);
    expect(surfaceNodes.some((node) => node.id === "librarian")).toBe(true);
    expect(surfaceNodes.every((node) => node.nodeType === "agent")).toBe(false);
  });
});
