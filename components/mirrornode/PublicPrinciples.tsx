export function PublicPrinciples() {
  return (
    <section id="principles" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">The way we work</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">Responsibility grows alongside capability.</h2>
      <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">
        Good systems make their boundaries visible. We distinguish what is observed from what is proposed,
        name uncertainty plainly, and preserve meaningful decisions for accountable people.
      </p>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {[
          { title: "Control", body: "Know who can act, what requires approval, and where the system must stop." },
          { title: "Continuity", body: "Make dependencies, handoffs, and operating context understandable across changes in models, providers, and sessions." },
          { title: "Evidence", body: "Separate verified behavior from assumptions, claims, and plans. Document what can actually be supported." },
        ].map((item) => (
          <article key={item.title} className="rounded-xl border border-white/10 bg-white/[0.035] p-6">
            <h3 className="text-xl font-semibold text-cyan-100">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">{item.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 border-l-2 border-cyan-200/40 pl-5">
        <p className="max-w-3xl text-lg leading-8 text-white/80">
          Clear convictions. Defensible claims. No manufactured authority.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
          MIRRORNODE is the commercial systems and assessment work. House Ramses is a distinct,
          developing public-service vision focused on responsibility and community care;
          it is not presented here as an established ministry or a purchased service.
        </p>
      </div>
    </section>
  );
}
