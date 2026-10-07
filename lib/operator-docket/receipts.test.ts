import { describe, expect, it } from "vitest";
import { dockets } from "./dockets";
import { evidenceView, receipts } from "./receipts";

const now = Date.parse("2026-09-18T04:00:00Z");
const ready = { ...dockets[2], attentionState: "READY_FOR_DECISION" as const };
describe("attention evidence boundaries", () => {
  it("keeps placement independent and does not fabricate acknowledgement", () => {
    expect(dockets).toHaveLength(3);
    expect(ready.laneState).toBe("REFERENCE");
    expect(evidenceView(ready, now).attentionState).toBe("READY_FOR_DECISION");
    expect(ready.operatorAcknowledgedAt).toBeNull();
  });
  it("expires readiness at the exact deadline", () => {
    expect(evidenceView(ready, Date.parse(receipts["workspace-base"].reviewBy!)))
      .toEqual({ attentionState: "NEEDS_EVIDENCE", evidenceState: "STALE" });
  });
  it("does not follow a superseding receipt into readiness", () => {
    const registry = { ...receipts, "workspace-base": { ...receipts["workspace-base"], supersededBy: "new-receipt" } };
    expect(evidenceView(ready, now, registry)).toEqual({ attentionState: "NEEDS_EVIDENCE", evidenceState: "SUPERSEDED" });
  });
  it.each([null, "missing"])("fails closed for missing receipt %s", (receiptRef) => {
    expect(evidenceView({ ...ready, receiptRef }, now).attentionState).toBe("NEEDS_EVIDENCE");
  });
  it.each([null, "invalid", "2027-01-01T00:00:00Z"])("rejects unknown/invalid/future observation %s", (evidenceObservedAt) => {
    const registry = { ...receipts, "workspace-base": { ...receipts["workspace-base"], evidenceObservedAt } };
    expect(evidenceView({ ...ready, evidenceObservedAt }, now, registry).evidenceState).toBe("MISSING");
  });
  it("rejects mismatched timestamps and absent deadlines", () => {
    expect(evidenceView({ ...ready, evidenceObservedAt: null }, now).evidenceState).toBe("MISSING");
    const registry = { ...receipts, "workspace-base": { ...receipts["workspace-base"], reviewBy: null } };
    expect(evidenceView(ready, now, registry).evidenceState).toBe("MISSING");
  });
  it("preserves HOLD when evidence expires or disappears", () => {
    expect(evidenceView(dockets[1], now + 86400000).attentionState).toBe("HOLD");
    expect(evidenceView({ ...dockets[1], receiptRef: null }, now).attentionState).toBe("HOLD");
  });
});
