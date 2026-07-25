import OsirisAuditIntakeForm from './OsirisAuditIntakeForm';

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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Osiris Audit v1
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          {sessionId ? 'Payment received' : 'Checkout confirmation missing'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          {sessionId
            ? 'Complete the intake below so the structural review can begin. The target delivery window is 3 business days after complete intake.'
            : 'We could not verify a Stripe checkout session from this URL.'}
        </p>

        {sessionId ? (
          <OsirisAuditIntakeForm sessionId={sessionId} />
        ) : (
          <div
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"
            role="alert"
          >
            <h2 className="font-semibold text-amber-950">
              Intake unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page does not contain the Stripe checkout confirmation
              needed to open the intake. Return using the success link from
              checkout or reply to your payment receipt for assistance.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
