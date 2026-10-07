export type AttentionState = "READY_FOR_DECISION" | "NEEDS_EVIDENCE" | "HOLD";
export type LaneState = "ACTIVE" | "PARKED" | "REFERENCE";
export type Receipt = {
  id: string;
  path: string;
  scope: string;
  evidenceObservedAt: string | null;
  reviewBy: string | null;
  supersededBy: string | null;
};
export type Docket = {
  id: string;
  title: string;
  summary: string;
  attentionState: AttentionState;
  laneState: LaneState;
  source: string;
  receiptRef: string | null;
  evidenceObservedAt: string | null;
  operatorAcknowledgedAt: string | null;
  operatorAcknowledgementRef: string | null;
  why: string;
  established: string;
  unresolved: string;
  decision: string;
  nextReceipt: string;
  doesNotAuthorize: string;
  document: string;
};
