import {
  littleFoxAcceptanceCriteria,
  littleFoxArtifacts,
  littleFoxDeferredFeatures,
  littleFoxModules,
  littleFoxOverview,
  littleFoxTasks,
  type LittleFoxStatus,
} from "@/content/little-fox";

const statusClasses: Record<LittleFoxStatus, string> = {
  ready: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  active: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  review: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  blocked: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

function StatusPill({ status }: { status: LittleFoxStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

function Panel({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(8,145,178,0.08)] backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">{kicker}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function LittleFoxConsole() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <section className="relative overflow-hidden border-b border-orange-200/10 px-6 py-8 md:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.24),transparent_30rem),radial-gradient(circle_at_80%_15%,rgba(103,232,249,0.16),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-orange-200/40 bg-orange-300/10 text-xl shadow-[0_0_28px_rgba(251,146,60,0.18)]">
                🦊
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-orange-100">Little Fox</p>
                <p className="text-sm text-white/55">MIRRORNODE Audit Surface v0</p>
              </div>
            </div>
            <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-cyan-100">
              Reviewable boundary artifact
            </div>
          </nav>

          <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)] lg:items-end">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-orange-100">
                {littleFoxOverview.eyebrow}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-tight text-white md:text-7xl">
                {littleFoxOverview.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">{littleFoxOverview.summary}</p>
            </div>
            <div className="rounded-3xl border border-orange-200/20 bg-orange-300/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-100">Boundary rule</p>
              <p className="mt-3 text-xl leading-8 text-white/85">{littleFoxOverview.boundary}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-6 py-8 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Panel title="System Overview" kicker="Den">
            <div className="grid gap-3 sm:grid-cols-2">
              {littleFoxModules.map((module) => (
                <article key={module.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                      <p className="mt-1 text-sm text-white/50">{module.role}</p>
                    </div>
                    <StatusPill status={module.status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/65">{module.summary}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-5">
          <Panel title="Task Queue" kicker="Trail">
            <div className="space-y-3">
              {littleFoxTasks.map((task) => (
                <article key={task.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/40">{task.owner}</p>
                    </div>
                    <StatusPill status={task.state} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">{task.nextAction}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-7">
          <Panel title="Recent Artifacts" kicker="Finds">
            <div className="space-y-3">
              {littleFoxArtifacts.map((artifact) => (
                <article key={artifact.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{artifact.title}</h3>
                      <p className="mt-1 text-sm text-white/45">{artifact.type}</p>
                    </div>
                    <StatusPill status={artifact.state} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">{artifact.summary}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-5">
          <Panel title="Review Boundary" kicker="Lookout">
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-white">Acceptance criteria</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                  {littleFoxAcceptanceCriteria.map((criterion) => (
                    <li key={criterion} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <h3 className="font-semibold text-amber-50">Deferred from v0</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {littleFoxDeferredFeatures.map((feature) => (
                    <span key={feature} className="rounded-full border border-amber-200/20 px-3 py-1 text-xs text-amber-50/80">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
