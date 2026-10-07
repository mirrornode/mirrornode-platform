import type { AttentionState, Docket, Receipt } from "./types";

export const receipts: Readonly<Record<string, Receipt>> = {
  "workspace-base": {
    id: "workspace-base",
    path: "docs/operator/receipts/WORKSPACE_BASE.md",
    scope: "Local Git identity and frozen source inspection; not runtime proof",
    evidenceObservedAt: "2026-09-18T03:13:21Z",
    reviewBy: "2026-09-19T03:13:21Z",
    supersededBy: null,
  },
  "radar-inspection": {
    id: "radar-inspection",
    path: "docs/operator/receipts/RADAR_INSPECTION.md",
    scope: "Exact-head code inspection; live runtime remains unverified",
    evidenceObservedAt: "2026-09-18T03:13:21Z",
    reviewBy: "2026-09-19T03:13:21Z",
    supersededBy: null,
  },
};

// Expiration limits presentation claims. It cannot grant or revoke authority.
export function evidenceView(docket: Docket, now: number, registry = receipts): {
  attentionState: AttentionState;
  evidenceState: "CURRENT" | "MISSING" | "STALE" | "SUPERSEDED";
} {
  const receipt = docket.receiptRef ? registry[docket.receiptRef] : undefined;
  let evidenceState: "CURRENT" | "MISSING" | "STALE" | "SUPERSEDED" = "MISSING";
  if (receipt?.supersededBy) evidenceState = "SUPERSEDED";
  else if (receipt && receipt.evidenceObservedAt === docket.evidenceObservedAt) {
    const observed = Date.parse(receipt.evidenceObservedAt ?? "");
    const deadline = Date.parse(receipt.reviewBy ?? "");
    if (Number.isFinite(now) && Number.isFinite(observed) && Number.isFinite(deadline)
      && observed <= now && deadline > observed) {
      evidenceState = now >= deadline ? "STALE" : "CURRENT";
    }
  }
  return {
    evidenceState,
    attentionState: docket.attentionState === "HOLD" ? "HOLD"
      : evidenceState === "CURRENT" ? docket.attentionState : "NEEDS_EVIDENCE",
  };
}
