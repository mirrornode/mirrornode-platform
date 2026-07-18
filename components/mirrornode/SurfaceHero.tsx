import Link from "next/link";
import { boundaryCopy } from "@/content/mirrornode/boundaries";
import { SurfaceBoundaryNotice } from "./SurfaceBoundaryNotice";

export function SurfaceHero() {
  return (
    <section className="relative overflow-hidden border-b border-cyan-300/10 bg-[#05070a] px-6 py-8 text-white md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,152,163,0.22),transparent_38rem)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-12">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_24px_rgba(103,232,249,0.18)]">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">MIRRORNODE</p>
              <p className="text-sm text-white/55">Adaptive path. Governed authority.</p>
            </div>
          </div>
          <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-100">
            Static public surface
          </div>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">Governed public surface</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-tight text-white md:text-7xl">
              Enter lanes. Inspect nodes. Understand the system.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              MIRRORNODE presents lanes, relationships, and reviewed public representations of the Agent Stack without flattening governance, execution, or human authority boundaries.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#surface" className="rounded-lg bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">
                Explore the system
              </a>
              <Link href="/audit" className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30">
                Review Osiris Audit
              </Link>
            </div>
          </div>
          <SurfaceBoundaryNotice state="static">{boundaryCopy.heroStack}</SurfaceBoundaryNotice>
        </div>
      </div>
    </section>
  );
}
