import type { ExposureState } from "./types";

export type BoundaryCopyBlock = {
  badge: string;
  inline: string;
  detail: string;
};

export const boundaryStates: Record<ExposureState, BoundaryCopyBlock> = {
  static: {
    badge: "Static",
    inline: "This section is a static representation of MIRRORNODE structure.",
    detail:
      "This view presents structure, sequence, and naming for public orientation. It does not claim live runtime, backend execution, or autonomous action.",
  },
  "live-preview": {
    badge: "Live Preview",
    inline: "This section reflects limited live state and remains subject to review.",
    detail:
      "This view may expose constrained live signals or recent system state. It should be treated as a reviewed preview rather than full operational authority.",
  },
  reviewed: {
    badge: "Reviewed",
    inline: "This section is reviewed for public interpretation.",
    detail:
      "This public copy has been checked against current source-backed records for scope accuracy. Reviewed presentation does not itself create authority, expose operator controls, or claim a live runtime instance.",
  },
  deferred: {
    badge: "Deferred",
    inline: "This public classification remains intentionally limited pending reconciliation.",
    detail:
      "This item may be named for public orientation, but unresolved placement, authority, or release status is not inferred. It does not expose entry, control, or operational authority while reconciliation remains open.",
  },
  "internal-only": {
    badge: "Internal Only",
    inline: "This surface is represented conceptually and is not publicly exposed.",
    detail:
      "This area belongs to MIRRORNODE internal governance or execution layers. The public site may acknowledge its existence, but does not expose direct access or authority claims.",
  },
};

export const boundaryCopy = {
  heroStack:
    "Node-map entries shown here are selected public representations, not a claim of the complete Agent Stack. Role, status, and authority wording follow current source-backed governance and reconciliation records; presentation does not create authority.",
  audit:
    "Osiris surfaces findings and recommendations. Remediation requires human decision. No autonomous changes are made.",
  technical:
    "Documentation reflects current implementation. Planned interfaces are labeled. Nothing is implied as production-ready unless explicitly marked.",
} as const;
