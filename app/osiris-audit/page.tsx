import Link from "next/link";
import OsirisAuditCheckoutButton from "./OsirisAuditCheckoutButton";
import OsirisAuditSequence from "../../components/osiris/OsirisAuditSequence";

const auditDescription =
  "A human-reviewed structural assessment of control, capability continuity, evidence durability, and provider dependence across your AI system.";

export const metadata = {
  title: "Osiris Audit v1 | MIRRORNODE",
  description: auditDescription,
  openGraph: {
    title: "Osiris Audit v1 | MIRRORNODE",
    description: auditDescription,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Osiris Audit v1 | MIRRORNODE",
    description: auditDescription,
  },
};

const deliverables = [
  ["System & Dependency Map", "The supplied system shape, important dependencies, and the boundaries of what was actually reviewed."],
  ["Substrate Exposure Findings", "Where a required function depends on one provider, model, token, session, credential, or machine—only where the evidence supports that conclusion."],
  ["Authority Boundary Findings", "Where consequential permissions are explicit, ambiguous, or effectively delegated into prompts, agents, tools, or provider behavior."],
  ["Evidence Continuity Gaps", "Where approvals, reviews, handoffs, actions, or outcomes may not survive outside model memory or operator recollection."],
  ["Prioritized Remediation Path", "Normally no more than seven next actions, ordered by structural importance rather than product upsell."],
  ["Unknowns & Scope Limits", "What the supplied evidence could not establish, so uncertainty is preserved instead of converted into a score."],
] as const;

export default function OsirisAuditPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-zinc-100">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          MIRRORNODE / FIRST PRODUCT
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">
          Osiris Audit v1
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">
          Control · Continuity · Evidence
        </p>
        <p className="mt-5 text-xl leading-8 text-zinc-300">
          Measure what happens to your AI system when the model, provider, credential, session, or infrastructure underneath it changes.
        </p>
        <p className="mt-4 max-w-3xl text-zinc-400">
          Osiris is a one-pass, human-reviewed structural assessment of the system you are actually operating.
          It looks for provider dependence, authority blur, evidence gaps, and continuity failures without pretending
          that a short audit can certify portability, security, or production readiness.
        </p>
      </header>

      <OsirisAuditSequence />

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What we examine</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Control</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Who or what can inspect, propose, mutate, approve, execute, publish, or deliver—and whether those boundaries remain explicit outside the model layer.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Continuity</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Which required functions depend on one substrate, and whether the function is defined clearly enough to be reassigned without silently lowering its acceptance standard.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Evidence</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Whether important claims, approvals, reviews, handoffs, actions, and outcomes can be reconstructed after the model session is gone.
            </p>
          </article>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What you get</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          One structured audit document based on up to five primary authorized artifacts or links, plus one clarification pass for factual issues or missed original-intake context.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {deliverables.map(([title, description]) => (
            <article key={title} className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Best for</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Founders or technical operators putting AI into a real business process</li>
          <li>- Teams already using multiple models, agents, prompts, or automation providers</li>
          <li>- Builders who do not know what stops working when one API, credential, model, session, or machine disappears</li>
          <li>- Security, platform, or governance leads who need a clearer map before increasing AI authority</li>
          <li>- Consultants or integrators who want an independent structural review before recommending more infrastructure</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What this is not</h2>
        <p className="mt-4 text-zinc-300">
          This is a bounded structural review: one pass, performed by hand with AI-assisted analysis, at the scope declared in your intake.
          It is not penetration testing, legal or regulatory advice, compliance certification, exhaustive line-by-line code review,
          model benchmarking, performance testing, remediation, or a guarantee of vulnerability discovery, safety, provider portability,
          capability continuity, or production readiness.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Access and data handling</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Provide only material you are authorized to share.</li>
          <li>- Review access must be read-only, time-limited, and scope-limited.</li>
          <li>- The reviewed repository state is pinned to a specific commit when repository evidence is in scope.</li>
          <li>- Do not submit production credentials, customer databases, or end-user data.</li>
          <li>- Private source is not sent to a third-party AI service without explicit authorization.</li>
          <li>- Active source materials and working copies are removed no later than 30 days after delivery, subject to documented backup and provider-log retention cycles.</li>
        </ul>
      </section>

      <section className="mb-12">
        <OsirisAuditCheckoutButton />
        <p className="mt-3 text-sm text-zinc-500">
          $149 USD. Secure checkout via Stripe. One-time payment. Pilot pricing while fulfillment time, repeatability, and customer outcomes are measured.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What happens after payment</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-300">
          <li>You receive a Stripe receipt at the email used for payment.</li>
          <li>You complete a short intake covering your system, goals, concerns, scope, dependencies, and up to five authorized artifacts or links.</li>
          <li>The review separates observed evidence from interpretation and preserves unsupported points as unknowns.</li>
          <li>An accountable human Operator reviews and signs the delivered report.</li>
          <li>The audit is delivered as one structured document with prioritized next actions.</li>
          <li>One clarification pass is included for factual issues or missed context from the original intake.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Turnaround and refund boundary</h2>
        <p className="mt-4 text-zinc-300">
          Target delivery is 3 business days after payment and complete intake.
          Before substantive review begins, cancellation or inability to establish
          authorized access receives a full refund. After substantive review begins,
          refunds are limited to non-delivery, clear fulfillment failure, or an
          Operator-approved exception.
        </p>
      </section>

      <footer className="mt-16 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          Back home
        </Link>
      </footer>
    </main>
  );
}
