import {
  littleFoxArtifacts,
  littleFoxModules,
  littleFoxReviewChecklist,
  littleFoxTasks,
  type LittleFoxState,
} from "@/content/little-fox/console";

const stateClass: Record<LittleFoxState, string> = {
  active: "border-emerald-200/30 bg-emerald-200/10 text-emerald-100",
  review: "border-cyan-200/30 bg-cyan-200/10 text-cyan-100",
  blocked: "border-rose-200/30 bg-rose-200/10 text-rose-100",
  ready: "border-amber-200/30 bg-amber-200/10 text-amber-100",
  deferred: "border-white/15 bg-white/5 text-white/60",
};

function StatePill({ state }: { state: LittleFoxState }) {
  return (
    <span className={["rounded-full border px-2.5 py-1 text-xs font-medium capitalize", stateClass[state]].join(" ")}>
      {state}
    </span>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={["rounded-lg border border-white/10 bg-slate-950/60 p-5", className].join(" ")}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200/80">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function LittleFoxConsole() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <section className="relative overflow-hidden border-b border-cyan-200/10 px-6 py-10 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.18),transparent_28rem),radial-gradient(circle_at_82%_22%,rgba(16,185,129,0.12),transparent_24rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">MIRRORNODE Audit Surface v0</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">Little Fox</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 md:text-lg">
                A small inspectable console for system state, active modules, recent outputs, and the next reviewable move.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200/20 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50/80 lg:max-w-sm">
              Little Fox is a doorway into the work, not the full system. This v0 displays structured state and handoff context without live automation or execution authority.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel eyebrow="Overview" title="Current State" className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-cyan-200/15 bg-cyan-200/10 p-4">
              <p className="text-3xl font-semibold text-white">{littleFoxModules.length}</p>
              <p className="mt-1 text-sm text-white/60">visible modules</p>
            </div>
            <div className="rounded-lg border border-emerald-200/15 bg-emerald-200/10 p-4">
              <p className="text-3xl font-semibold text-white">{littleFoxTasks.length}</p>
              <p className="mt-1 text-sm text-white/60">tracked tasks</p>
            </div>
            <div className="rounded-lg border border-amber-200/15 bg-amber-200/10 p-4">
              <p className="text-3xl font-semibold text-white">{littleFoxArtifacts.length}</p>
              <p className="mt-1 text-sm text-white/60">recent artifacts</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold text-white">v0</p>
              <p className="mt-1 text-sm text-white/60">review surface</p>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Modules" title="Active Surfaces">
          <div className="space-y-3">
            {littleFoxModules.map((module) => (
              <article key={module.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{module.name}</h3>
                    <p className="mt-1 text-sm text-white/55">{module.role}</p>
                  </div>
                  <StatePill state={module.state} />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{module.signal}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Tasks" title="Next Reviewable Moves">
          <div className="space-y-3">
            {littleFoxTasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/35">{task.owner}</p>
                    <h3 className="mt-1 font-semibold text-white">{task.title}</h3>
                  </div>
                  <StatePill state={task.state} />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{task.nextAction}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Artifacts" title="Recent Outputs">
          <div className="space-y-3">
            {littleFoxArtifacts.map((artifact) => (
              <article key={artifact.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{artifact.title}</h3>
                    <p className="mt-1 text-sm text-white/55">{artifact.kind}</p>
                  </div>
                  <StatePill state={artifact.state} />
                </div>
                <p className="mt-3 font-mono text-xs text-cyan-100/65">{artifact.location}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Boundary" title="Review Gate">
          <div className="space-y-3">
            {littleFoxReviewChecklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-200" />
                <p className="text-sm leading-6 text-white/65">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-lg border border-rose-200/20 bg-rose-200/10 p-4 text-sm leading-6 text-rose-50/80">
            Deferred from v0: live orchestration, deep automation, admin controls, agent interoperability, identity recursion, and complex analytics.
          </p>
        </Panel>
      </section>
    </main>
  );
}
