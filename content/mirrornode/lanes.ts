import type { ExposureState } from "./types";

export const processSequence = ["Input", "Routing", "Review", "Canon", "Output"];

export type PublicLane = {
  slug: string;
  title: string;
  descriptor: string;
  pipeline: readonly string[];
  body: string;
  status: "active" | "held" | "static" | "planned";
  exposureState: ExposureState;
  requiresAcknowledgement?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

export const lanes: readonly PublicLane[] = [
  {
    slug: "overview",
    title: "Overview",
    descriptor: "What the system does",
    pipeline: ["Context", "Memory", "Routing", "Review", "Delivery"],
    body:
      "Mirrornode organizes how AI work moves through context, memory, routing, review, and delivery. It is not a chatbot wrapper or vague automation layer.",
    status: "active",
    exposureState: "static",
    ctaLabel: "View overview",
    ctaHref: "#overview",
  },
  {
    slug: "audit",
    title: "Audit",
    descriptor: "Osiris Audit pipeline",
    pipeline: ["Intake", "Structural Review", "Evidence Pass", "Findings", "Delivery"],
    body:
      "Osiris Audit is one concrete lane: a bounded structural review with findings and recommendations, not autonomous remediation.",
    status: "active",
    exposureState: "reviewed",
    requiresAcknowledgement: true,
    ctaLabel: "Review audit lane",
    ctaHref: "#audit",
  },
  {
    slug: "agent-stack",
    title: "Agent Stack",
    descriptor: "Roles, scope, authority",
    pipeline: ["Held", "Manifest Review", "Reconcile", "Approve", "Publish"],
    body:
      "Held pending canonical manifest review. Agent authority wording will not be published from draft blueprint tables.",
    status: "held",
    exposureState: "deferred",
  },
  {
    slug: "live-state",
    title: "Live State",
    descriptor: "System state model",
    pipeline: ["Queued", "In Review", "Canon", "Delivered", "Deferred"],
    body:
      "This lane explains state categories. First pass is static and explanatory; no live metrics are shown.",
    status: "static",
    exposureState: "static",
    ctaLabel: "View state model",
    ctaHref: "#live-state",
  },
  {
    slug: "mission",
    title: "Mission",
    descriptor: "Purpose and governance",
    pipeline: ["Purpose", "Human Authority", "Review", "Coherence", "Trust"],
    body:
      "Mirrornode exists to make AI coordination honest: structured review, declared authority, and coherent output.",
    status: "active",
    exposureState: "reviewed",
    ctaLabel: "View mission",
    ctaHref: "#mission",
  },
  {
    slug: "technical",
    title: "Technical",
    descriptor: "Architecture and interfaces",
    pipeline: ["Repos", "Docs", "APIs", "Integrations", "Boundaries"],
    body:
      "Technical material exposes architecture and interfaces without implying unreleased production capability.",
    status: "active",
    exposureState: "reviewed",
    ctaLabel: "View technical lane",
    ctaHref: "#technical",
  },
  {
    slug: "media",
    title: "Media",
    descriptor: "Explanatory examples",
    pipeline: ["Mock", "Recorded State", "Label", "Explain", "Review"],
    body:
      "Media examples must identify whether they are mock or real, when they were created, and whether they reflect current implementation.",
    status: "static",
    exposureState: "static",
    ctaLabel: "View media guidance",
    ctaHref: "#media",
  },
  {
    slug: "community",
    title: "Community",
    descriptor: "Participation and updates",
    pipeline: ["Contact", "Updates", "Request", "Review", "Response"],
    body:
      "Community begins lightweight: contact, updates, and structured request paths. Open community board is deferred.",
    status: "planned",
    exposureState: "deferred",
  },
];
