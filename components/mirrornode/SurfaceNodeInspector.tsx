import Link from "next/link";
import { boundaryStates } from "@/content/mirrornode/boundaries";
import type { PublicInspectorRecord } from "@/content/mirrornode/types";
import { SurfaceBoundaryNotice } from "./SurfaceBoundaryNotice";
import { SurfaceStateBadge } from "./SurfaceStateBadge";

const authorityLabels = {
  "public-surface": "Public",
  "human-review": "Human-gated",
  "governance-plane": "Governance",
  "execution-plane": "Internal",
  "canonical-reference": "Reviewed reference",
} as const;

export function SurfaceNodeInspector({ node }: { node: PublicInspectorRecord }) {
  const boundary = boundaryStates[node.exposureState];

  return (
    <aside className="rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{node.nodeType}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{node.publicName}</h2>
        </div>
        <SurfaceStateBadge state={node.exposureState} />
      </div>

      <p className="mt-3 text-sm leading-6 text-white/65">{node.summary}</p>

      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Function</dt>
          <dd className="mt-1 text-white/75">{node.functionSummary}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Authority</dt>
          <dd className="mt-1 text-amber-100/90">
            {authorityLabels[node.authorityLayer]} — {node.authoritySummary}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Evidence</dt>
          <dd className="mt-1 text-white/75">{node.evidenceKind.replace("-", " ")}</dd>
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

      <details className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-white/60">Boundary detail</summary>
        <div className="mt-3">
          <SurfaceBoundaryNotice state={node.exposureState} detail>
            {boundary.detail}
          </SurfaceBoundaryNotice>
        </div>
      </details>

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
