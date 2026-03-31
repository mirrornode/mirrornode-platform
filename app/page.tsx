export default function Home() {
  const agents = [
    {
      id: "lucian",
      name: "Lucian",
      role: "Core Orchestrator",
      status: "active",
      description: "Primary lattice coordinator. Routes cognition between agents and maintains system coherence.",
    },
    {
      id: "osiris",
      name: "Osiris",
      role: "Payment & Commerce",
      status: "active",
      description: "Stripe-integrated transaction engine. Handles all payment flows, invoices, and financial state.",
    },
    {
      id: "hermes",
      name: "Hermes",
      role: "Messenger & API Bridge",
      status: "active",
      description: "Inter-agent communication relay. Manages webhooks, external API calls, and message routing.",
    },
    {
      id: "thoth",
      name: "Thoth",
      role: "Knowledge & Memory",
      status: "active",
      description: "Persistent memory and knowledge graph. Indexes context, history, and cross-agent state.",
    },
    {
      id: "theia",
      name: "Theia",
      role: "Vision & Interface",
      status: "active",
      description: "UI/UX intelligence and visual rendering layer. Drives front-end surfaces and user-facing output.",
    },
    {
      id: "ptah",
      name: "Ptah",
      role: "Builder & Infrastructure",
      status: "active",
      description: "DevOps and systems architect. Manages deployments, scaffolding, and infrastructure automation.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "grid-scroll 8s linear infinite",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,152,163,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-8 py-5 animate-fade-in"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {/* SVG Logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="MIRRORNODE" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="3" fill="var(--accent)" />
            <line x1="14" y1="1" x2="14" y2="7" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="14" y1="21" x2="14" y2="27" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="1" y1="14" x2="7" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="21" y1="14" x2="27" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="4.22" y1="4.22" x2="8.34" y2="8.34" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="19.66" y1="19.66" x2="23.78" y2="23.78" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="23.78" y1="4.22" x2="19.66" y2="8.34" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="8.34" y1="19.66" x2="4.22" y2="23.78" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              letterSpacing: "0.15em",
              color: "var(--foreground)",
              fontWeight: 500,
            }}
          >
            MIRRORNODE
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            LATTICE v0.1
          </span>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                color: "var(--accent)",
              }}
            >
              ONLINE
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-8 pt-24 pb-16">
        <div className="animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              color: "var(--accent)",
              marginBottom: "1.25rem",
              textTransform: "uppercase",
            }}
          >
            Distributed AI Orchestration
          </p>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
              marginBottom: "1.5rem",
              maxWidth: "16ch",
            }}
          >
            Six agents.
            <br />
            <span style={{ color: "var(--accent)" }}>One lattice.</span>
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--text-muted)",
              maxWidth: "52ch",
              lineHeight: 1.7,
              marginBottom: "3rem",
            }}
          >
            MIRRORNODE coordinates Lucian, Osiris, Hermes, Thoth, Theia, and Ptah
            across quantum-cognitive bridges — a living orchestration lattice
            for distributed intelligence.
          </p>
        </div>

        {/* System status bar */}
        <div
          className="animate-fade-in animate-fade-in-delay-2 mb-16 flex items-center gap-4 rounded-lg px-5 py-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "inline-flex",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
            }}
          >
            SYSTEM STATUS
          </span>
          <span style={{ color: "var(--border)", fontSize: "0.75rem" }}>|</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--accent)",
            }}
          >
            6/6 AGENTS NOMINAL
          </span>
          <span style={{ color: "var(--border)", fontSize: "0.75rem" }}>|</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            LATTICE COHERENCE 100%
          </span>
        </div>

        {/* Agent grid */}
        <div
          className="animate-fade-in animate-fade-in-delay-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
            gap: "1px",
            background: "var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              className="group animate-fade-in"
              style={{
                background: "var(--surface)",
                padding: "1.75rem",
                transition: "background 180ms cubic-bezier(0.16, 1, 0.3, 1)",
                animationDelay: `${0.3 + i * 0.07}s`,
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface)";
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.18em",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {agent.role}
                  </p>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "var(--foreground)",
                    }}
                  >
                    {agent.name}
                  </h2>
                </div>
                <div className="relative flex items-center justify-center" style={{ marginTop: "0.25rem" }}>
                  <span
                    className="absolute inline-block h-4 w-4 rounded-full"
                    style={{
                      background: "var(--accent)",
                      opacity: 0.3,
                      animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                  <span
                    className="relative inline-block h-2 w-2 rounded-full"
                    style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }}
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  maxWidth: "38ch",
                }}
              >
                {agent.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="animate-fade-in animate-fade-in-delay-6 mt-16 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "var(--text-faint)",
            }}
          >
            © 2026 MIRRORNODE — INPhase Resplendence Cognition
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "var(--text-faint)",
            }}
          >
            BUILD 0.1.0
          </span>
        </div>
      </main>
    </div>
  );
}
