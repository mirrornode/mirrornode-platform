import { processSequence } from "@/content/mirrornode/lanes";

export function MirrornodeProcessSequence() {
  return (
    <div className="rounded-lg border border-cyan-300/15 bg-white/[0.03] p-4">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Static sequence</p>
      <div className="grid gap-3 md:grid-cols-5">
        {processSequence.map((step, index) => (
          <div key={step} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
            <p className="font-mono text-xs text-cyan-200/80">0{index + 1}</p>
            <p className="mt-2 text-lg font-semibold text-white">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
