import Link from "next/link";
import AuditCheckoutButton from "./AuditCheckoutButton";

export const metadata = {
  title: "Osiris Audit v1 — MIRRORNODE",
  description:
    "A structural audit of your AI system. One pass, by hand. $149.",
};

export default function AuditPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-zinc-100">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          MIRRORNODE
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">
          Osiris Audit v1
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          A structural review of your AI system. One pass, written by hand. $149.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What you get</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li>— A written audit of your system&apos;s structural posture</li>
          <li>— Drift patterns named and described</li>
          <li>— Concrete next moves, in shipping order</li>
          <li>— Delivered as a single document by email</li>
        </ul>
      </section>

      <section className="mb-12">
        <AuditCheckoutButton />
        <p className="mt-3 text-sm text-zinc-500">
          Secure checkout via Stripe. One-time payment.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">What happens after payment</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-300">
          <li>You get a Stripe receipt at the email on your payment.</li>
          <li>We reply with a short intake — what to audit, scope, context.</li>
          <li>The audit is written by hand and emailed to you.</li>
          <li>One round of clarification is included if anything is unclear.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold">Manual-first, by design</h2>
        <p className="mt-4 text-zinc-300">
          v1 is intentionally hand-delivered. No dashboards, no portals,
          no automated intake. The audit is a written document produced
          by a person who has read your system. The pricing reflects that
          scope.
        </p>
      </section>

      <footer className="mt-16 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          ← Back to MIRRORNODE
        </Link>
      </footer>
    </main>
  );
}
