import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard — MIRRORNODE",
  description: "Live system dashboard for the MIRRORNODE orchestration lattice.",
};

const agents = [
  { id: "lucian",  name: "Lucian",  role: "Core Orchestrator",      status: "nominal", uptime: "99.98%", tasks: 1247, domain: "Cognitive Routing" },
  { id: "osiris",  name: "Osiris",  role: "Payment & Commerce",      status: "nominal", uptime: "99.95%", tasks: 384,  domain: "Financial State" },
  { id: "hermes",  name: "Hermes",  role: "Messenger & API Bridge",  status: "nominal", uptime: "99.99%", tasks: 2891, domain: "Communication" },
  { id: "thoth",   name: "Thoth",   role: "Knowledge & Memory",      status: "nominal", uptime: "100%",   tasks: 5623, domain: "Persistent State" },
  { id: "theia",   name: "Theia",   role: "Vision & Interface",      status: "nominal", uptime: "99.97%", tasks: 812,  domain: "Front-End Intel" },
  { id: "ptah",    name: "Ptah",    role: "Builder & Infrastructure", status: "nominal", uptime: "99.93%", tasks: 156,  domain: "DevOps & Systems" },
];

const metrics = [
  { label: "Total Tasks Processed", value: "11,113", delta: "+2.4%" },
  { label: "Lattice Coherence",     value: "100%",   delta: "stable" },
  { label: "Avg Agent Uptime",      value: "99.97%", delta: "+0.02%" },
  { label: "Active Bridges",        value: "6",      delta: "nominal" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] font-mono">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-[var(--accent)] text-sm tracking-widest font-bold hover:opacity-80">
          [ MIRRORNODE ]
        </Link>
        <span className="text-xs tracking-widest text-[var(--text-muted)]">DASHBOARD</span>
        <span className="text-xs text-green-400 tracking-wider">LIVE</span>
      </nav>

      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <p className="text-xs tracking-widest text-[var(--text-muted)] mb-2">System Overview</p>
        <h1 className="text-3xl font-bold tracking-tight">Lattice Dashboard</h1>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-8">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface)]">
            <p className="text-xs text-[var(--text-muted)] tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-[var(--accent)] mt-1">{m.delta}</p>
          </div>
        ))}
      </section>

      {/* Agent table */}
      <section className="px-6 pb-16">
        <h2 className="text-sm tracking-widest text-[var(--text-muted)] mb-4">Agent Registry</h2>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
            {["Agent", "Role", "Status", "Uptime", "Tasks"].map((h) => (
              <span key={h} className="text-xs tracking-widest text-[var(--text-muted)]">{h}</span>
            ))}
          </div>
          {/* Rows */}
          {agents.map((agent, i) => (
            <Link
              key={i}
              href={`/agents/${agent.id}`}
              className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="font-semibold">{agent.name}</span>
              <span className="text-[var(--text-muted)] text-sm">{agent.role}</span>
              <span className="text-green-400 text-xs tracking-wider">{agent.status}</span>
              <span className="text-sm">{agent.uptime}</span>
              <span className="text-sm">{agent.tasks.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-muted)]">
        <span>© 2026 MIRRORNODE — INPhase Resplendence Cognition</span>
        <span>BUILD 0.1.0</span>
      </footer>
    </div>
  );
}
