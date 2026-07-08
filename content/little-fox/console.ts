export type LittleFoxState = "active" | "review" | "blocked" | "ready" | "deferred";

export type LittleFoxModule = {
  id: string;
  name: string;
  role: string;
  state: LittleFoxState;
  signal: string;
};

export type LittleFoxTask = {
  id: string;
  title: string;
  owner: string;
  state: LittleFoxState;
  nextAction: string;
};

export type LittleFoxArtifact = {
  id: string;
  title: string;
  kind: string;
  state: LittleFoxState;
  location: string;
};

export const littleFoxModules: LittleFoxModule[] = [
  {
    id: "core-hub",
    name: "CORE-HUB",
    role: "Governance and review boundary",
    state: "review",
    signal: "Canon gates remain visible before material action.",
  },
  {
    id: "osiris",
    name: "Osiris Audit",
    role: "Commercial audit lane",
    state: "active",
    signal: "Offer, intake, checkout, and delivery language are being staged as bounded review.",
  },
  {
    id: "thoth",
    name: "Thoth",
    role: "Evidence validation",
    state: "ready",
    signal: "Source-bound review is available for claims, artifacts, and contradictions.",
  },
  {
    id: "librarian",
    name: "Librarian",
    role: "Artifact placement",
    state: "ready",
    signal: "Named outputs can be routed into a findable handoff trail.",
  },
];

export const littleFoxTasks: LittleFoxTask[] = [
  {
    id: "lf-001",
    title: "Review Little Fox v0 surface",
    owner: "Operator",
    state: "active",
    nextAction: "Confirm the single-screen console communicates state within 30 seconds.",
  },
  {
    id: "lf-002",
    title: "Lock v0 feature boundary",
    owner: "Theia",
    state: "review",
    nextAction: "Keep Little Fox as inspection and handoff only, not automation.",
  },
  {
    id: "lf-003",
    title: "Prepare implementation handoff",
    owner: "Merlin",
    state: "ready",
    nextAction: "Convert accepted panels into a branch checklist and review packet.",
  },
];

export const littleFoxArtifacts: LittleFoxArtifact[] = [
  {
    id: "artifact-001",
    title: "Working Artifact Brief",
    kind: "Scope brief",
    state: "ready",
    location: "Little Fox v0 seed content",
  },
  {
    id: "artifact-002",
    title: "MIRRORNODE Visual Surface",
    kind: "Public orientation",
    state: "active",
    location: "/",
  },
  {
    id: "artifact-003",
    title: "Osiris Audit Sequence Brief",
    kind: "Review packet",
    state: "review",
    location: "Audit sequence planning track",
  },
];

export const littleFoxReviewChecklist = [
  "A new viewer can understand system status quickly.",
  "At least one real module and one real artifact are represented.",
  "Next actions are explicit and reviewable.",
  "The boundary between display and execution is visible.",
  "The code shape can grow into live data later without rewriting the page.",
] as const;
