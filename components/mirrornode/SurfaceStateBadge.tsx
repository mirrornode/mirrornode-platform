import { boundaryStates } from "@/content/mirrornode/boundaries";
import type { ExposureState } from "@/content/mirrornode/types";

const stateClass: Record<ExposureState, string> = {
  static: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  "live-preview": "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  reviewed: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  deferred: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  "internal-only": "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

export function SurfaceStateBadge({ state }: { state: ExposureState }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]",
        stateClass[state],
      ].join(" ")}
    >
      {boundaryStates[state].badge}
    </span>
  );
}
