import { surfaceNodes } from "@/content/mirrornode/nodes";

type SurfaceNode = (typeof surfaceNodes)[number];

export function SurfaceNodeInspector({ node }: { node: SurfaceNode }) {
  return (
    <aside className="rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.05)]">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{node.label}</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">{node.name}</h2>
      <p className="mt-3 text-sm leading-6 text-white/65">{node.role}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Scope</dt>
          <dd className="mt-1 text-white/75">{node.scope}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Authority Boundary</dt>
          <dd className="mt-1 text-amber-100/90">{node.authorityBoundary}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Output</dt>
          <dd className="mt-1 text-white/75">{node.output}</dd>
        </div>
      </dl>
    </aside>
  );
}
