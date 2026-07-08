export type LittleFoxStatus = "ready" | "active" | "blocked" | "review";

export type LittleFoxModule = {
  name: string;
  role: string;
  status: LittleFoxStatus;
  summary: string;
};

export type LittleFoxTask = {
  title: string;
  owner: string;
  state: LittleFoxStatus;
  nextAction: string;
};

export type LittleFoxArtifact = {
  title: string;
  type: string;
  state: LittleFoxStatus;
  summary: string;
};

export const littleFoxOverview = {
  eyebrow: "Little Fox v0",
  title: "A small console for seeing what is real, active, and reviewable.",
  summary:
    "Little Fox is the first inspectable doorway into MIRRORNODE: a static, reviewable audit surface that shows system state, active work, recent outputs, and the next accountable move.",
  boundary:
    "Little Fox does not run the forest. It helps the operator see the path before deeper automation is trusted.",
};

export const littleFoxModules: LittleFoxModule[] = [
  {
    name: "Den",
    role: "System overview",
    status: "ready",
    summary: "Shows the current surface purpose, scope, and review boundary in one pass.",
  },
  {
    name: "Trail",
    role: "Active tasks",
    status: "active",
    summary: "Lists the work that is in motion, incomplete, or ready for handoff.",
  },
  {
    name: "Finds",
    role: "Recent artifacts",
    status: "review",
    summary: "Surfaces the latest useful outputs without requiring full system immersion.",
  },
  {
    name: "Threads",
    role: "Module connections",
    status: "ready",
    summary: "Names the visible relationships between modules, tasks, and artifacts.",
  },
  {
    name: "Lookout",
    role: "Review boundary",
    status: "blocked",
    summary: "Makes clear what cannot proceed without human review or later implementation.",
  },
];

export const littleFoxTasks: LittleFoxTask[] = [
  {
    title: "Working Artifact Brief",
    owner: "Operator / Theia",
    state: "active",
    nextAction: "Consolidate scope, panels, schema, seed content, and review checklist.",
  },
  {
    title: "Little Fox UI Frame",
    owner: "Grok lane",
    state: "review",
    nextAction: "Validate panel hierarchy and visual emphasis before implementation expands.",
  },
  {
    title: "External Pattern Scan",
    owner: "Perplexity lane",
    state: "review",
    nextAction: "Borrow inspectability patterns only; reject enterprise dashboard bloat.",
  },
  {
    title: "Review Gate",
    owner: "Operator",
    state: "blocked",
    nextAction: "Approve v0 surface before connecting live data, orchestration, or permissions.",
  },
];

export const littleFoxArtifacts: LittleFoxArtifact[] = [
  {
    title: "SMI Console / MIRRORNODE Audit Surface v0 Brief",
    type: "Scope brief",
    state: "ready",
    summary: "Defines the smallest complete surface that proves inspectability and handoff readiness.",
  },
  {
    title: "Little Fox Naming Boundary",
    type: "Alignment note",
    state: "ready",
    summary: "Separates the artifact identity from the mechanism: approachable scout, not command sovereign.",
  },
  {
    title: "Implementation Spec Draft",
    type: "Build packet",
    state: "active",
    summary: "Translates the brief into page architecture, component inventory, seed data, and acceptance checks.",
  },
];

export const littleFoxAcceptanceCriteria = [
  "A new viewer can understand current system status within 30 seconds.",
  "At least one real project/module is represented.",
  "At least one real artifact is visible.",
  "Next actions are explicit and reviewable.",
  "The review boundary is visible before automation claims are made.",
  "The page is static or lightly mocked and safe to deploy as a first surface.",
];

export const littleFoxDeferredFeatures = [
  "Live orchestration",
  "Deep automation",
  "Agent interoperability beyond display/mock connectors",
  "Permissions and admin complexity",
  "Recursive identity logic",
  "Complex analytics",
];
