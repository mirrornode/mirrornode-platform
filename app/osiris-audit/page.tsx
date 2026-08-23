import Link from "next/link";
import OsirisAuditCheckoutButton from "./OsirisAuditCheckoutButton";
import OsirisAuditSequence from "../../components/osiris/OsirisAuditSequence";

const auditDescription =
  "A human-reviewed structural audit of control, continuity, evidence, and provider dependence across your AI system, workflow, or automation stack.";

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
        <p className="mt-4 text-lg text-zinc-400">
          A structural audit of whether your AI system stays controllable, understandable, and recoverable when models, providers, credentials, or infrastructure change.
        </p>
        <p className="mt-4 text-zinc-300">
          Osiris reviews the system you are actually operating: agents, automations,
          prompts, handoffs, evidence, provider dependencies, and the places where
          authority can quietly blur. The result is one human-reviewed document that
          separates observed facts, risks, unknowns, and the next actions worth taking.
        </p>
      </header>

      <OsirisAuditSequence />

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What we examine</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Control</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Who or what can inspect, propose, mutate, approve, execute, publish, or deliver—and whether those boundaries are explicit.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Continuity</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Which required functions depend on one provider, model, token, session, or machine, and what would be required to preserve capability through a substrate change.
            </p>
          </article>
          <article className="rounded-lg border border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-100">Evidence</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Whether important claims, approvals, reviews, handoffs, and outcomes can be reconstructed from durable records instead of model memory or operator recollection.
            </p>
          </article>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What you get</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- One structured, human-reviewed audit document</li>
          <li>- Review of up to 5 primary artifacts or links</li>
          <li>- A map of your current system shape and consequential authority boundaries</li>
          <li>- Provider- and substrate-dependence observations where the supplied evidence supports them</li>
          <li>- Evidence-linked risks, unknowns, likely failure modes, and continuity gaps</li>
          <li>- Prioritized next actions, normally no more than 7</li>
          <li>- One clarification pass for factual issues or missed original-intake context</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Best for</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Founders putting multiple AI tools into a real business process</li>
          <li>- Teams with agent, prompt, automation, or provider sprawl</li>
          <li>- Builders unsure what stops working when an API, credential, model, or machine disappears</li>
          <li>- Operators who need clearer authority and evidence boundaries before adding more automation</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Professional boundary</h2>
        <p className="mt-4 text-zinc-300">
          This is a bounded structural review: one pass, performed by hand with
          AI-assisted analysis, at the scope declared in your intake. It is not
          penetration testing, legal or regulatory advice, compliance certification,
          exhaustive line-by-line code review, performance benchmarking, remediation,
          or a guarantee of vulnerability discovery, safety, provider portability, or production readiness.
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
          $149 USD. Secure checkout via Stripe. One-time payment. This is intentionally
          underpriced pilot pricing while fulfillment time, repeatability, and customer outcomes are measured.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What happens after payment</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-300">
          <li>You receive a Stripe receipt at the email used for payment.</li>
          <li>You complete a short intake covering your system, goals, concerns, scope, dependencies, and up to 5 authorized artifacts or links.</li>
          <li>The review separates observed evidence from interpretation and unsupported unknowns.</li>
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
