import type { Docket } from "./types";

// Selection/order is reviewed source, not an autonomous THEIA write surface.
// Basis: Operator's three-lane request; priority reason appears on each card.
export const dockets: readonly Docket[] = [
  {
    id: "osiris-audit", title: "OSIRIS Audit", attentionState: "NEEDS_EVIDENCE", laneState: "ACTIVE",
    summary: "Reported deployed and rehearsable · commercially unproven",
    source: "Codex curation from Operator brief and referenced conversation; deployment not re-observed",
    receiptRef: null, evidenceObservedAt: null, operatorAcknowledgedAt: null, operatorAcknowledgementRef: null,
    why: "First commercial loop needs explicit payment and reversal decisions.",
    established: "The supplied brief reports deployed controlled fulfillment and rehearsal evidence. This pass has not independently verified production.",
    unresolved: "No real-money positive, failed-payment negative, or controlled refund/delivery receipt is established here.",
    decision: "Operator must separately authorize any real-money rehearsal and the refund rule, amount, target, and stop conditions.",
    nextReceipt: "Complete OSIRIS_PATHS.md: positive purchase through received delivery; failed payment without case/intake/fulfillment; controlled reversal of the same purchase.",
    doesNotAuthorize: "Payment, refund, fulfillment, customer contact, deployment, credentials, or public promotion.",
    document: "docs/operator/dockets/OSIRIS_AUDIT.md",
  },
  {
    id: "prospect-radar", title: "Prospect Radar", attentionState: "HOLD", laneState: "ACTIVE",
    summary: "Bounded correction required · live runtime unverified",
    source: "Codex exact-head inspection; Grok credited as artifact origin per supplied brief, not verification authority",
    receiptRef: "radar-inspection", evidenceObservedAt: "2026-09-18T03:13:21Z", operatorAcknowledgedAt: null, operatorAcknowledgementRef: null,
    why: "A narrow review exposes evidence and access boundaries that must be resolved before integration.",
    established: "PR #31 head a01d6e58c9504ffc0b286fa1ee7d9dc8a974f913 inspected. Draft normalization and no social posting path observed in Radar source.",
    unresolved: "HTTPS is labeled VERIFIED; raw provider errors reach clients; scan access/cost controls and persistence provenance/retention need correction. Hosted logs and live results unobserved.",
    decision: "Review the bounded correction packet. Any later merge, deployment, credential configuration, or promotion needs separate authorization.",
    nextReceipt: "RADAR_RUNTIME.md with exact head, API provenance, draft/storage rules, redacted errors/logs, access controls, and independently observed runtime evidence.",
    doesNotAuthorize: "Provider execution, social posting, outreach, merge, deployment, credentials, or public promotion.",
    document: "docs/operator/dockets/PROSPECT_RADAR.md",
  },
  {
    id: "operator-workspace", title: "Operator Workspace", attentionState: "NEEDS_EVIDENCE", laneState: "REFERENCE",
    summary: "Frozen workspace base · use before extending",
    source: "Codex read-only Git and dashboard source inspection",
    receiptRef: "workspace-base", evidenceObservedAt: "2026-09-18T03:13:21Z", operatorAcknowledgedAt: null, operatorAcknowledgementRef: null,
    why: "Preserve the usable workspace slice while a separate docket unit makes current work legible.",
    established: "Frozen branch resolves to b7540b552d13a0f3177feb7b6898dac36a1c176b. Existing .tmp/ remains untouched.",
    unresolved: "No new usage receipt or independent runtime verification of the frozen base is claimed.",
    decision: "Use the existing workspace; record a demonstrated missing capability before proposing another slice.",
    nextReceipt: "A bounded usage receipt with exact checkout, action, observed outcome, and any actual capability gap.",
    doesNotAuthorize: "Changing the frozen base, speculative expansion, runtime selection, or deployment.",
    document: "docs/operator/dockets/OPERATOR_WORKSPACE.md",
  },
];
