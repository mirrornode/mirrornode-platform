import { notFound } from "next/navigation";

const agents: Record<string, {
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  status: string;
  domain: string;
}> = {
  lucian: {
    name: "Lucian",
    role: "Core Orchestrator",
    domain: "Cognitive Routing",
    status: "nominal",
    description:
      "Primary lattice coordinator. Routes cognition between agents, resolves conflicts, and maintains system coherence across all active processes. Lucian is the root node — all inter-agent traffic passes through or is authorized by this agent.",
    capabilities: [
      "Inter-agent task routing",
      "Conflict resolution and arbitration",
      "Lattice coherence monitoring",
      "Priority queue management",
      "Global state synchronization",
    ],
  },
  osiris: {
    name: "Osiris",
    role: "Payment & Commerce",
    domain: "Financial State",
    status: "nominal",
    description:
      "Stripe-integrated transaction engine. Handles all payment flows, invoice generation, subscription management, and financial state reconciliation. Osiris is the source of truth for all monetary transactions within the lattice.",
    capabilities: [
      "Stripe payment processing",
      "Invoice and billing automation",
      "Subscription lifecycle management",
      "Financial state reconciliation",
      "Transaction audit logging",
    ],
  },
  hermes: {
    name: "Hermes",
    role: "Messenger & API Bridge",
    domain: "Communication Layer",
    status: "nominal",
    description:
      "Inter-agent communication relay and external API bridge. Manages all webhook ingestion, outbound API calls, message queuing, and protocol translation between internal lattice agents and external systems.",
    capabilities: [
      "Webhook ingestion and routing",
      "External API orchestration",
      "Message queue management",
      "Protocol translation",
      "Rate limiting and retry logic",
    ],
  },
  thoth: {
    name: "Thoth",
    role: "Knowledge & Memory",
    domain: "Persistent State",
    status: "nominal",
    description:
      "Persistent memory and knowledge graph engine. Indexes all cross-agent context, session history, semantic relationships, and long-term knowledge. Thoth provides recall and retrieval services to every agent in the lattice.",
    capabilities: [
      "Knowledge graph construction",
      "Cross-agent context indexing",
      "Semantic search and retrieval",
      "Session and history persistence",
      "Memory compression and pruning",
    ],
  },
  theia: {
    name: "Theia",
    role: "Vision & Interface",
    domain: "Front-End Intelligence",
    status: "nominal",
    description:
      "UI/UX intelligence and visual rendering layer. Drives all front-end surfaces, user-facing output, and interface decisions. Theia translates lattice state into human-readable and interactive experiences.",
    capabilities: [
      "Dynamic UI generation",
      "Visual state rendering",
      "User interaction modeling",
      "Accessibility and responsive design",
      "Interface personalization",
    ],
  },
  ptah: {
    name: "Ptah",
    role: "Builder & Infrastructure",
    domain: "DevOps & Systems",
    status: "nominal",
    description:
      "DevOps and systems architect. Manages deployments, infrastructure scaffolding, CI/CD pipelines, environment configuration, and platform automation. Ptah builds and maintains the foundation the lattice runs on.",
    capabilities: [
      "Deployment automation",
      "Infrastructure scaffolding",
      "CI/CD pipeline management",
      "Environment configuration",
      "System health monitoring",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(agents).map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents[id];
  if (!agent) return {};
  return {
    title: `${agent.name} — MIRRORNODE`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents[id];
  if (!agent) notFound();

  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,152,163,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a
          href="/"
          className="flex items-center gap-3"
          style={{ textDecoration: "none" }}
        >
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-label="MIRRORNODE" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="var(--accent)" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="1" y1="14" x2="7" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="21" y1="14" x2="27" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", letterSpacing: "0.15em", color: "var(--foreground)", fontWeight: 500 }}>
            MIRRORNODE
          </span>
        </a>
        <a
          href="/dashboard"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}
        >
          DASHBOARD →
        </a>
      </nav>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-3xl px-8 pt-20 pb-24">
        <div className="animate-fade-in">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "1rem", textTransform: "uppercase" }}>
            {agent.domain}
          </p>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--foreground)", marginBottom: "0.5rem" }}>
            {agent.name}
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "2.5rem", textTransform: "uppercase" }}>
            {agent.role}
          </p>

          {/* Status badge */}
          <div
            className="mb-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 5px var(--accent)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase" }}>
              {agent.status}
            </span>
          </div>

          {/* Description */}
          <div
            className="mb-12 rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p style={{ fontSize: "1rem", color: "var(--foreground)", lineHeight: 1.75, opacity: 0.85 }}>
              {agent.description}
            </p>
          </div>

          {/* Capabilities */}
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "1.25rem", textTransform: "uppercase" }}>
              Capabilities
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {agent.capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg px-5 py-3.5 animate-fade-in"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>◆</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--foreground)", opacity: 0.8 }}>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
