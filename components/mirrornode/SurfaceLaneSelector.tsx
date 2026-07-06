import { lanes } from "@/content/mirrornode/lanes";

export function SurfaceLaneSelector() {
  return (
    <section id="lanes" className="mx-auto max-w-7xl px-6 py-12 md:px-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">Lanes</p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-5xl">Enter by purpose, not by noise.</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/55">
          Each lane names what it can do, what it does not claim, and where review remains.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => (
          <a
            key={lane.slug}
            href={`#${lane.slug}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-200/40 hover:bg-cyan-200/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{lane.title}</h3>
              <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/50">
                {lane.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-cyan-100/70">{lane.descriptor}</p>
            <p className="mt-4 text-sm leading-6 text-white/55">{lane.body}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
