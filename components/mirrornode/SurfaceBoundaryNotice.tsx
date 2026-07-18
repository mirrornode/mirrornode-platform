import { boundaryStates } from "@/content/mirrornode/boundaries";
import type { ExposureState } from "@/content/mirrornode/types";
import { SurfaceStateBadge } from "./SurfaceStateBadge";

type SurfaceBoundaryNoticeProps = {
  state: ExposureState;
  children?: React.ReactNode;
  depth?: "inline" | "detail";
  expandable?: boolean;
};

const noticeClass: Record<ExposureState, string> = {
  static: "border-slate-300/15 bg-slate-300/[0.06] text-slate-100/75",
  "live-preview": "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-50/80",
  reviewed: "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-50/80",
  deferred: "border-amber-300/25 bg-amber-300/[0.08] text-amber-100/85",
  "internal-only": "border-rose-300/25 bg-rose-300/[0.08] text-rose-100/85",
};

export function SurfaceBoundaryNotice({
  state,
  children,
  depth = "inline",
  expandable = false,
}: SurfaceBoundaryNoticeProps) {
  const copy = boundaryStates[state];
  const content = children ?? (depth === "detail" ? copy.detail : copy.inline);
  const classes = ["rounded-lg border px-4 py-3 text-sm leading-relaxed", noticeClass[state]].join(" ");

  if (expandable) {
    return (
      <details className={classes}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
          <span>Boundary detail</span>
          <SurfaceStateBadge state={state} />
        </summary>
        <p className="mt-3 text-sm leading-6 opacity-90">{content}</p>
      </details>
    );
  }

  return (
    <div className={classes}>
      <div className="flex items-start gap-3">
        <SurfaceStateBadge state={state} />
        <p>{content}</p>
      </div>
    </div>
  );
}
