const principles = [
  {
    title: "Control",
    body: "Keep consequential authority outside the model layer. Models can inspect, propose, challenge, and assist without silently enlarging their own permissions.",
  },
  {
    title: "Continuity",
    body: "Define critical functions independently of one provider, then qualify replacement substrates against the acceptance contract instead of assuming model equivalence.",
  },
  {
    title: "Evidence",
    body: "Preserve observations, reviews, authorizations, handoffs, and outcomes outside model memory so a substrate change does not erase the operating record.",
  },
];

const mechanism = [
  "Define the required function independently of a model.",
  "Benchmark which substrates are actually eligible to perform it.",
  "Keep authority and side-effect gates outside the cognition layer.",
  "Keep evidence durable enough to reconstruct what happened after the model is gone.",
];

export function ProviderIndependentSpine() {
  return (
    <section className="border-b border-cyan-300/10 bg-[#070a0f] px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
            Capability continuity
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Models are replaceable. Your capability, authority, and evidence should not be.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/60">
            MIRRORNODE separates the intelligence substrate from the control system around it. Models supply cognition;
            they do not own the authority boundary, the durable operating record, or the definition of the business function
            they are asked to perform.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
            Provider independence is an architecture target, not a claim that every model is equivalent today. A replacement
            substrate earns a role by meeting its governed acceptance criteria.
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

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">How the architecture works</p>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {mechanism.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-white/60">
                <span className="font-mono text-cyan-200">0{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
