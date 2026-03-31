import { notFound } from "next/navigation";
import { getAgent, agentList } from "@/lib/agents";

export function generateStaticParams() {
  return agentList.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return {};
  return {
    title: `${agent.name} — MIRRORNODE`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
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
        <a href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
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
        <div className="flex items-center gap-6">
          <a
            href="/agents"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}
          >
            ← AGENTS
          </a>
          <a
            href="/dashboard"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}
          >
            DASHBOARD →
          </a>
        </div>
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
