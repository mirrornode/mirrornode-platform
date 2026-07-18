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
      "This view has been prepared for public use and reviewed for scope accuracy. It may describe governed system behavior without exposing internal operator controls.",
  },
  deferred: {
    badge: "Deferred",
    inline: "This capability is not part of the current public release.",
    detail:
      "This capability is intentionally out of scope for the present release. The public surface may reference it conceptually, but does not expose entry, control, or operational detail.",
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
    "Agent Stack entries shown here are public representations. Role and authority wording remains subject to canonical manifest review.",
  audit:
    "Osiris surfaces findings and recommendations. Remediation requires human decision. No autonomous changes are made.",
  technical:
    "Documentation reflects current implementation. Planned interfaces are labeled. Nothing is implied as production-ready unless explicitly marked.",
} as const;
