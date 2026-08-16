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
    pipeline: ["Context / Memory", "Routing", "Review", "Canon", "Delivery"],
    body:
      "MIRRORNODE organizes how AI work moves through context and memory, routing, review, governed reference/canon, and delivery. It is not a chatbot wrapper or an implied automation authority layer.",
    status: "active",
    exposureState: "reviewed",
    ctaLabel: "View overview",
    ctaHref: "#overview",
  },
  {
    slug: "audit",
    title: "Audit",
    descriptor: "Osiris Audit pipeline",
    pipeline: ["Intake", "Structural Review", "Evidence Pass", "Findings", "Delivery"],
    body:
      "Osiris Audit is one concrete lane: a bounded structural review with evidence-linked findings and recommendations, not autonomous remediation.",
    status: "active",
    exposureState: "reviewed",
    requiresAcknowledgement: true,
    ctaLabel: "Review audit lane",
    ctaHref: "#audit",
  },
  {
    slug: "agent-stack",
    title: "Agent Stack",
    descriptor: "Identity, function, authority",
    pipeline: ["Identity", "Function", "Authority", "Public Basis", "Boundary"],
    body:
      "Public Agent Stack entries are source-backed representations of current MIRRORNODE records. They separate identity, function, authority, evidence basis, and unresolved placement without inferring live runtime or stronger governance status from presentation alone.",
    status: "active",
    exposureState: "reviewed",
    ctaLabel: "Inspect Agent Stack",
    ctaHref: "#surface",
  },
  {
    slug: "live-state",
    title: "Live State",
    descriptor: "System state model",
    pipeline: ["Queued", "In Review", "Canon", "Delivered", "Deferred"],
    body:
      "This lane explains state categories. The current public view is static and explanatory; no live operational metrics are shown.",
    status: "static",
    exposureState: "static",
    ctaLabel: "View state model",
    ctaHref: "#live-state",
  },
  {
    slug: "mission",
    title: "Mission",
    descriptor: "Purpose and governance",
    pipeline: ["Purpose", "Bounded Authority", "Review", "Coherence", "Trust"],
    body:
      "MIRRORNODE exists to make AI coordination inspectable: explicit roles, bounded authority, source-backed review, and coherent delivery.",
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
