import Link from "next/link";
import type { PublicInspectorRecord } from "@/content/mirrornode/types";
import { SurfaceBoundaryNotice } from "./SurfaceBoundaryNotice";
import { SurfaceStateBadge } from "./SurfaceStateBadge";

const authorityLabels = {
  "public-surface": "Public surface",
  "human-review": "Human-governed",
  "governance-plane": "Governance record",
  "execution-plane": "Internal execution",
  "canonical-reference": "Reference only",
} as const;

const evidenceLabels = {
  manifest: "Manifest-backed",
  snapshot: "Reconciliation snapshot",
  conceptual: "Conceptual representation",
  "reviewed-copy": "Reviewed source copy",
} as const;

export function SurfaceNodeInspector({ node }: { node: PublicInspectorRecord }) {
  return (
    <aside className="rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{node.nodeType}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{node.publicName}</h2>
        </div>
        <SurfaceStateBadge state={node.exposureState} />
      </div>

      <p className="mt-3 text-base leading-7 text-white/70">{node.summary}</p>

      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Function</dt>
          <dd className="mt-1 leading-6 text-white/75">{node.functionSummary}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Authority boundary</dt>
          <dd className="mt-1 leading-6 text-amber-100/90">
            {authorityLabels[node.authorityLayer]} — {node.authoritySummary}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Public basis</dt>
          <dd className="mt-1 text-white/75">{evidenceLabels[node.evidenceKind]}</dd>
        </div>
        {node.relations.length > 0 ? (
          <div>
            <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Relations</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {node.relations.map((relation) => (
                <span key={`${relation.direction}-${relation.target}`} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/65">
                  {relation.label}: {relation.target}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-5">
        <SurfaceBoundaryNotice state={node.exposureState} depth="detail" expandable />
      </div>

      {node.ctaMode !== "none" && node.ctaHref && node.ctaLabel ? (
        <div className="mt-5">
          <Link href={node.ctaHref} className="inline-flex rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-4 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/50">
            {node.ctaLabel}
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
