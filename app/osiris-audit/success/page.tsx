import type { Metadata } from 'next';
import OsirisAuditIntakeForm from './OsirisAuditIntakeForm';

export const metadata: Metadata = {
  title: 'Complete your Osiris Audit intake | MIRRORNODE',
  description:
    'Secure post-payment intake for Osiris Audit v1. Complete the authorized scope and context needed to begin review.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Osiris Audit v1 | MIRRORNODE',
    description: 'Secure post-payment intake for Osiris Audit v1.',
    type: 'website',
  },
};

type SuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = (await searchParams) || {};
  const sessionId =
    typeof params.session_id === 'string'
      ? params.session_id
      : Array.isArray(params.session_id)
        ? params.session_id[0]
        : null;

  return (
    <main className="min-h-screen bg-[#05070a] px-6 py-12 text-white sm:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-cyan-300/15 pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
            MIRRORNODE / OSIRIS
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {sessionId ? 'Secure audit handoff' : 'Checkout confirmation missing'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                {sessionId
                  ? 'Your Osiris Audit v1 engagement continues here. Complete the authorized intake to move the work into review.'
                  : 'We could not verify a Stripe checkout session from this URL.'}
              </p>
            </div>
            {sessionId ? (
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-cyan-100">
                MOPCON delivery surface
              </div>
            ) : null}
          </div>
        </header>

        {sessionId ? (
          <OsirisAuditIntakeForm sessionId={sessionId} />
        ) : (
          <section
            className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6"
            role="alert"
          >
            <h2 className="font-semibold text-amber-100">Intake unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-amber-50/75">
              This page does not contain the Stripe checkout confirmation needed to open the intake. Return using the success link from checkout or reply to your payment receipt for assistance.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
