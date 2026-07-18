export const exposureStates = [
  "static",
  "live-preview",
  "reviewed",
  "deferred",
  "internal-only",
] as const;

export type ExposureState = (typeof exposureStates)[number];

export type PublicNodeType =
  | "lane"
  | "agent"
  | "surface"
  | "sequence"
  | "boundary"
  | "reference";

export type AuthorityLayer =
  | "public-surface"
  | "human-review"
  | "governance-plane"
  | "execution-plane"
  | "canonical-reference";

export type EvidenceKind = "manifest" | "snapshot" | "conceptual" | "reviewed-copy";
export type CtaMode = "inspect" | "view-path" | "read-scope" | "none";

export type InspectorRelation = {
  label: string;
  target: string;
  direction: "upstream" | "downstream" | "related";
};

export type PublicInspectorRecord = {
  nodeId: string;
  publicName: string;
  canonicalName?: string;
  nodeType: PublicNodeType;
  laneAffiliation?: string;
  exposureState: ExposureState;
  authorityLayer: AuthorityLayer;
  summary: string;
  functionSummary: string;
  authoritySummary: string;
  relations: readonly InspectorRelation[];
  evidenceKind: EvidenceKind;
  timestamp?: string | null;
  ctaMode: CtaMode;
  ctaLabel?: string;
  ctaHref?: string;
};
