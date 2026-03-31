import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — MIRRORNODE",
  description: "Live system dashboard for the MIRRORNODE orchestration lattice.",
};

const agents = [
  { id: "lucian",  name: "Lucian",  role: "Core Orchestrator",       status: "nominal",  uptime: "99.98%", tasks: 1247, domain: "Cognitive Routing" },
  { id: "osiris",  name: "Osiris",  role: "Payment & Commerce",       status: "nominal",  uptime: "99.95%", tasks: 384,  domain: "Financial State" },
  { id: "hermes",  name: "Hermes",  role: "Messenger & API Bridge",   status: "nominal",  uptime: "99.99%", tasks: 2891, domain: "Communication" },
  { id: "thoth",   name: "Thoth",   role: "Knowledge & Memory",       status: "nominal",  uptime: "100%",   tasks: 5623, domain: "Persistent State" },
  { id: "theia",   name: "Theia",   role: "Vision & Interface",       status: "nominal",  uptime: "99.97%", tasks: 812,  domain: "Front-End Intel" },
  { id: "ptah",    name: "Ptah",    role: "Builder & Infrastructure", status: "nominal",  uptime: "99.93%", tasks: 156,  domain: "DevOps & Systems" },
];

const metrics = [
  { label: "Total Tasks Processed", value: "11,113", delta: "+2.4%" },
  { label: "Lattice Coherence",      value: "100%",   delta: "stable" },
  { label: "Avg Agent Uptime",       value: "99.97%", delta: "+0.02%" },
  { label: "Active Bridges",         value: "6",      delta: "nominal" },
];

export default function Dashboard() {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)" }}>DASHBOARD</span>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--accent)" }}>LIVE</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-8 pt-16 pb-24">
        {/* Header */}
        <div className="animate-fade-in mb-12">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            System Overview
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            Lattice Dashboard
          </h1>
        </div>

        {/* KPI row */}
        <div
          className="animate-fade-in animate-fade-in-delay-1 mb-10"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px,100%), 1fr))", gap: "1px", background: "var(--border)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}
        >
          {metrics.map((m, i) => (
            <div key={i} style={{ background: "var(--surface)", padding: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                {m.label}
              </p>
              <p style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--foreground)", fontVariantNumeric: "tabular-nums", marginBottom: "0.35rem" }}>
                {m.value}
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--accent)" }}>
                {m.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Agent table */}
        <div className="animate-fade-in animate-fade-in-delay-2">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem" }}>
            Agent Registry
          </p>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr",
                padding: "0.75rem 1.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Agent", "Role", "Status", "Uptime", "Tasks"].map((h) => (
                <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {agents.map((agent, i) => (
              <a
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="animate-fade-in"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr",
                  padding: "1rem 1.5rem",
                  borderBottom: i < agents.length - 1 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                  transition: "background 180ms cubic-bezier(0.16,1,0.3,1)",
                  animationDelay: `${0.2 + i * 0.06}s`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--foreground)" }}>{agent.name}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{agent.role}</span>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--accent)" }}>{agent.status}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{agent.uptime}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{agent.tasks.toLocaleString()}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="animate-fade-in animate-fade-in-delay-6 mt-16 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "var(--text-faint)" }}>
            © 2026 MIRRORNODE — INPhase Resplendence Cognition
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "var(--text-faint)" }}>
            BUILD 0.1.0
          </span>
        </div>
      </main>
    </div>
  );
}
