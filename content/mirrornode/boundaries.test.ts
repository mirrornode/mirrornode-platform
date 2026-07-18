import { describe, expect, it } from "vitest";
import { boundaryStates } from "./boundaries";
import { exposureStates } from "./types";

describe("public boundary states", () => {
  it("defines badge, inline, and detail copy for every exposure state", () => {
    for (const state of exposureStates) {
      expect(boundaryStates[state].badge).toBeTruthy();
      expect(boundaryStates[state].inline).toBeTruthy();
      expect(boundaryStates[state].detail).toBeTruthy();
    }
  });

  it("fails closed for deferred and internal-only states", () => {
    expect(boundaryStates.deferred.detail).toContain("does not expose entry");
    expect(boundaryStates["internal-only"].detail).toContain("does not expose direct access");
  });
});
