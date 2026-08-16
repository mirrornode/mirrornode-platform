import Link from "next/link";
import OsirisAuditCheckoutButton from "./OsirisAuditCheckoutButton";
import OsirisAuditSequence from "../../components/osiris/OsirisAuditSequence";

export const metadata = {
  title: "Osiris Audit v1 | MIRRORNODE",
  description:
    "A one-pass structural audit of your AI system, workflow, or automation stack.",
  openGraph: {
    title: "Osiris Audit v1 | MIRRORNODE",
    description:
      "A one-pass structural audit of your AI system, workflow, or automation stack.",
    type: "website",
  },
};

export default function OsirisAuditPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-zinc-100">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          MIRRORNODE
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">
          Osiris Audit v1
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          A one-pass structural audit of your AI system, workflow, or automation stack.
        </p>
        <p className="mt-4 text-zinc-300">
          If your AI tools, agents, automations, docs, prompts, and handoffs are
          starting to sprawl, Osiris Audit v1 gives you a clear outside review
          of the system you are actually operating.
        </p>
      </header>

      <OsirisAuditSequence />

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What you get</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- One structured audit document</li>
          <li>- Review of up to 5 primary artifacts or links</li>
          <li>- A summary of your current system shape</li>
          <li>- Evidence-linked observations, risks, and likely failure modes</li>
          <li>- Prioritized next actions, normally no more than 7</li>
          <li>- One clarification pass for original intake context</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Best for</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Solo founders using multiple AI tools</li>
          <li>- Teams with messy prompt or agent workflows</li>
          <li>- Builders unsure where their automation stack is fragile</li>
          <li>- Operators who need a clearer map before adding more tools</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Professional boundary</h2>
        <p className="mt-4 text-zinc-300">
          This is a bounded structural review: one pass, performed by hand with
          AI-assisted analysis, at the scope declared in your intake. It is not
          penetration testing, legal or regulatory advice, compliance certification,
          exhaustive line-by-line code review, performance benchmarking, remediation,
          or a guarantee of vulnerability discovery, safety, or production readiness.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Access and data handling</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Provide only material you are authorized to share.</li>
          <li>- Review access must be read-only, time-limited, and scope-limited.</li>
          <li>- The reviewed repository state is pinned to a specific commit.</li>
          <li>- Do not submit production credentials, customer databases, or end-user data.</li>
          <li>- Private source is not sent to a third-party AI service without explicit authorization.</li>
          <li>- Active source materials and working copies are removed no later than 30 days after delivery, subject to documented backup and provider-log retention cycles.</li>
        </ul>
      </section>

      <section className="mb-12">
        <OsirisAuditCheckoutButton />
        <p className="mt-3 text-sm text-zinc-500">
          $149 USD. Secure checkout via Stripe. One-time payment. This is intentionally
          underpriced pilot pricing while fulfillment time and outcomes are measured.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What happens after payment</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-300">
          <li>You receive a Stripe receipt at the email used for payment.</li>
          <li>You complete a short intake covering your system, goals, concerns, scope, and up to 5 authorized artifacts or links.</li>
          <li>An accountable human Operator reviews and signs the delivered report.</li>
          <li>The audit is delivered as one structured document.</li>
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
