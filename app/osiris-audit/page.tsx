import Link from "next/link";
import OsirisAuditCheckoutButton from "./OsirisAuditCheckoutButton";
import OsirisAuditSequence from "../../components/osiris/OsirisAuditSequence";

export const metadata = {
  title: "Osiris Audit v1 | Seraphyth Dynamics",
  description:
    "A one-pass structural audit of your AI system, workflow, or automation stack.",
  openGraph: {
    title: "Osiris Audit v1 | Seraphyth Dynamics",
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
          Seraphyth Dynamics
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
          <li>- Strengths, risks, and likely failure modes</li>
          <li>- Quick wins and recommended next actions</li>
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
        <h2 className="text-xl font-semibold">Not included</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>- Implementation, code changes, or deployment</li>
          <li>- Live debugging or ongoing consulting</li>
          <li>- Security certification, legal advice, tax advice, or medical advice</li>
          <li>- Guaranteed outcomes</li>
        </ul>
      </section>

      <section className="mb-12">
        <OsirisAuditCheckoutButton />
        <p className="mt-3 text-sm text-zinc-500">
          $149 USD. Secure checkout via Stripe. One-time payment.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What happens after payment</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-300">
          <li>You receive a Stripe receipt at the email used for payment.</li>
          <li>You receive a short intake request for your system summary, goals, concerns, and up to 5 artifacts or links.</li>
          <li>The audit is delivered as one structured document.</li>
          <li>One clarification pass is included for factual issues or missed context from the original intake.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Turnaround and refund boundary</h2>
        <p className="mt-4 text-zinc-300">
          Target delivery is 3 business days after payment and complete intake.
          Refunds are available before audit work begins. After work begins,
          refunds are available only for non-delivery or clear fulfillment failure.
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
