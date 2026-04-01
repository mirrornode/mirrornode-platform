"use client";

import { useEffect, useState, useCallback } from "react";
import { agentList, Agent } from "@/lib/agents";
import { domainToNumeraethe } from "@/fusion/types";

// ---------------------------------------------------------------------------
// Telemetry types
// ---------------------------------------------------------------------------

interface AgentTelemetry {
  id: string;
  status: "nominal" | "degraded" | "offline" | "initializing";
  last_heartbeat_ts: string | null;
  symbolic_depth: number;
  latency_ms: number | null;
}

interface EngineStatusResponse {
  agents: AgentTelemetry[];
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: AgentTelemetry["status"]): string {
  switch (status) {
    case "nominal":      return "var(--accent)";
    case "degraded":     return "#f59e0b";
    case "offline":      return "#ef4444";
    case "initializing": return "#a78bfa";
    default:             return "var(--text-muted)";
  }
}

function getDepthLabel(depth: number): string {
  if (depth >= 7) return "DEEP";
  if (depth >= 4) return "MID";
  if (depth >= 1) return "SHALLOW";
  return "IDLE";
}

function getDepthBarWidth(depth: number): string {
  return `${Math.min(100, (depth / 8) * 100)}%`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5)  return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [telemetry, setTelemetry] = useState<Map<string, AgentTelemetry>>(new Map());
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/engines/status");
      if (!res.ok) throw new Error();
      const data: EngineStatusResponse = await res.json();
      const map = new Map<string, AgentTelemetry>();
      data.agents.forEach((a) => map.set(a.id, a));
      setTelemetry(map);
      setLastUpdated(data.updated_at);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 10s polling
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10_000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Merge manifest agent with live telemetry (manifest is source of truth for identity)
  function resolveAgent(agent: Agent) {
    const live = telemetry.get(agent.id);
    return {
      ...agent,
      status:          live?.status          ?? agent.status,
      symbolic_depth:  live?.symbolic_depth  ?? 0,
      last_heartbeat_ts: live?.last_heartbeat_ts ?? null,
      latency_ms:      live?.latency_ms      ?? null,
    };
  }

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
        <div className="flex items-center gap-6">
          {lastUpdated && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
              SYNCED {timeAgo(lastUpdated)}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#ef4444" }}>
              TELEMETRY OFFLINE
            </span>
          )}
          <a
            href="/dashboard"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none" }}
          >
            DASHBOARD →
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-8 pt-20 pb-24">
        {/* Header */}
        <div className="mb-16 animate-fade-in">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "1rem", textTransform: "uppercase" }}>
            Lattice Manifest
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--foreground)", marginBottom: "1rem" }}>
            Situation Room
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "52ch" }}>
            {agentList.length} agents initialized across the MIRRORNODE lattice.
            {loading ? " Acquiring telemetry…" : " Live telemetry active."}
          </p>
        </div>

        {/* Agent grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: "1rem" }}>
          {agentList.map((baseAgent, i) => {
            const agent = resolveAgent(baseAgent);
            const statusColor = getStatusColor(agent.status);
            const numeraetheType = domainToNumeraethe(agent.domain);
            const depthLabel = getDepthLabel(agent.symbolic_depth);
            const depthWidth = getDepthBarWidth(agent.symbolic_depth);

            return (
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
                {/* Domain + live pulse */}
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--accent)", textTransform: "uppercase" }}>
                    {agent.domain}
                  </span>

                  {/* Live heartbeat pulse */}
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: statusColor,
                        boxShadow: agent.status === "nominal"
                          ? `0 0 0 0 ${statusColor}`
                          : "none",
                        animation: agent.status === "nominal"
                          ? "heartbeat-pulse 2s ease-out infinite"
                          : "none",
                      }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                {/* Name + role */}
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--foreground)", marginBottom: "0.25rem" }}>
                  {agent.name}
                </h2>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "1rem" }}>
                  {agent.role}
                </p>

                {/* Description preview */}
                <p style={{ fontSize: "0.875rem", color: "var(--foreground)", lineHeight: 1.65, opacity: 0.7, marginBottom: "1.25rem" }}>
                  {agent.description.slice(0, 100)}…
                </p>

                {/* Lattice Depth indicator */}
                <div style={{ marginBottom: "1rem" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: "0.35rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      LATTICE DEPTH
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", color: statusColor, textTransform: "uppercase" }}>
                      {depthLabel} · {agent.symbolic_depth}/8
                    </span>
                  </div>
                  <div
                    style={{
                      height: "2px",
                      background: "var(--border)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: depthWidth,
                        background: statusColor,
                        borderRadius: "2px",
                        transition: "width 0.6s ease",
                        boxShadow: `0 0 6px ${statusColor}`,
                      }}
                    />
                  </div>
                </div>

                {/* Numeraethe type + telemetry footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      {numeraetheType}
                    </span>
                    {agent.last_heartbeat_ts && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                        ♥ {timeAgo(agent.last_heartbeat_ts)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)", letterSpacing: "0.1em" }}>
                    VIEW →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </main>

      {/* Heartbeat pulse keyframe */}
      <style>{`
        @keyframes heartbeat-pulse {
          0%   { box-shadow: 0 0 0 0 var(--accent-alpha, rgba(79,152,163,0.6)); }
          70%  { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}
