const principles = [
  {
    title: "Control",
    body: "Keep consequential authority explicit. Models can inspect, propose, challenge, and assist without silently enlarging their own permissions.",
  },
  {
    title: "Continuity",
    body: "Design critical AI functions so a provider, API token, model session, or compute host can change without erasing the required capability or the operating record.",
  },
  {
    title: "Evidence",
    body: "Preserve what was observed, reviewed, authorized, delivered, and still unknown so decisions can be reconstructed instead of remembered from a model conversation.",
  },
];

export function ProviderIndependentSpine() {
  return (
    <section className="border-b border-cyan-300/10 bg-[#070a0f] px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
            Provider-independent control infrastructure
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Change the model. Keep the capability, authority boundary, and record.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
            MIRRORNODE is building toward portable cognition: preferred hosted models where they add value,
            MIRRORNODE-controlled inference where continuity matters, and deterministic verification beneath both.
            Provider independence is an architecture target, not a claim that every substrate is equivalent today.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle.title} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
              <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-cyan-200">
                {principle.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{principle.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
