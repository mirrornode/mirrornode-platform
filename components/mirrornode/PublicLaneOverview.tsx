import { lanes } from "@/content/mirrornode/lanes";
import { SurfaceBoundaryNotice } from "./SurfaceBoundaryNotice";

export function PublicLaneOverview() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      <div className="grid gap-4 lg:grid-cols-2">
        {lanes.map((lane) => (
          <article id={lane.slug} key={lane.slug} className="scroll-mt-8 rounded-lg border border-white/10 bg-slate-950/55 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{lane.descriptor}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{lane.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/60">{lane.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {lane.pipeline.map((step) => (
                <span key={step} className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-50/80">
                  {step}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5">
        <SurfaceBoundaryNotice state="static" />
      </div>
    </section>
  );
}
