import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Operator Workspace — MIRRORNODE",
  description:
    "A bounded MIRRORNODE operating surface for navigating verified capabilities and work lanes.",
  robots: {
    index: false,
    follow: false,
  },
};

const lanes = [
  {
    title: "Osiris Audit",
    description:
      "Customer-facing structural audit flow: offer, checkout, verified intake, and controlled fulfillment.",
    href: "/osiris-audit",
    action: "Open audit surface",
  },
  {
    title: "AI Nodes",
    description:
      "Navigate the current node-facing surfaces without presenting inferred runtime state as telemetry.",
    href: "/agents",
    action: "Open node directory",
  },
  {
    title: "Librarian",
    description:
      "Knowledge and document-oriented working surface for material that belongs inside MIRRORNODE.",
    href: "/librarian",
    action: "Open librarian",
  },
  {
    title: "Runtime Readiness",
    description:
      "Read the application readiness endpoint directly. Its response is runtime evidence, not a decorative status.",
    href: "/api/health/ready",
    action: "Read health evidence",
  },
];

const buildTargets = [
  "Client intake and case work",
  "File intake, organization, and export",
  "Direct node-assisted work surfaces",
  "Osiris case operation and delivery",
  "Operator legal and administrative workspace",
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <nav className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <Link
          href="/"
          className="text-sm font-bold tracking-widest text-[var(--accent)] hover:opacity-80"
        >
          [ MIRRORNODE ]
        </Link>

        <span className="text-xs tracking-widest text-[var(--text-muted)]">
          OPERATOR WORKSPACE
        </span>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-3 text-xs tracking-[0.22em] text-[var(--text-muted)]">
          WORKING SURFACE · EVIDENCE BOUNDED
        </p>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
          Work from what the system can actually establish.
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-muted)]">
          This workspace is the operating entry point for MIRRORNODE. It does
          not manufacture uptime, task counts, coherence scores, or other live
          state. Runtime claims belong to explicit evidence surfaces.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-10 md:grid-cols-2">
        {lanes.map((lane) => (
          <article
            key={lane.title}
            className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <h2 className="text-xl font-semibold">{lane.title}</h2>

            <p className="mt-3 flex-1 leading-7 text-[var(--text-muted)]">
              {lane.description}
            </p>

            <Link
              href={lane.href}
              className="mt-6 text-sm font-semibold tracking-wide text-[var(--accent)] hover:opacity-80"
            >
              {lane.action} →
            </Link>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <p className="text-xs tracking-[0.2em] text-[var(--text-muted)]">
            BUILD DIRECTION
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            One workspace, progressively connected.
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-[var(--text-muted)]">
            These are implementation targets, not claims that the capabilities
            are complete. Each becomes active only when its underlying state,
            authority, and evidence boundary is wired.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {buildTargets.map((target) => (
              <div
                key={target}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
              >
                {target}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-5 text-xs text-[var(--text-muted)]">
        MIRRORNODE · Operator workspace · No inferred live-state claims
      </footer>
    </main>
  );
}
