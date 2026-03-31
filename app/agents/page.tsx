import { agentList } from "@/lib/agents";

export const metadata = {
  title: "Agents — MIRRORNODE",
  description: "Active agents in the MIRRORNODE lattice.",
};

export default function AgentsPage() {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,152,163,0.08) 0%, transparent 65%)",
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
        <a
          href="/dashboard"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}
        >
          DASHBOARD →
        </a>
      </nav>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-8 pt-20 pb-24">
        {/* Header */}
        <div className="mb-16 animate-fade-in">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "1rem", textTransform: "uppercase" }}>
            Lattice Manifest
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--foreground)", marginBottom: "1rem" }}>
            Active Agents
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "52ch" }}>
            {agentList.length} agents initialized across the MIRRORNODE lattice. Each node operates autonomously within its domain while coordinating through Lucian.
          </p>
        </div>

        {/* Agent grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: "1rem" }}>
          {agentList.map((agent, i) => (
            <a
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="group animate-fade-in rounded-xl p-6"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                display: "block",
                transition: "border-color 0.2s ease, background 0.2s ease",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              {/* Domain + status */}
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--accent)", textTransform: "uppercase" }}>
                  {agent.domain}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: agent.status === "nominal" ? "var(--accent)" : agent.status === "degraded" ? "#f59e0b" : "#ef4444",
                      boxShadow: agent.status === "nominal" ? "0 0 4px var(--accent)" : "none",
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Name */}
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--foreground)", marginBottom: "0.25rem" }}>
                {agent.name}
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem" }}>
                {agent.role}
              </p>

              {/* Description preview */}
              <p style={{ fontSize: "0.875rem", color: "var(--foreground)", lineHeight: 1.65, opacity: 0.7 }}>
                {agent.description.slice(0, 100)}…
              </p>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {agent.capabilities.length} capabilities
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)", letterSpacing: "0.1em" }}>
                  VIEW →
                </span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
