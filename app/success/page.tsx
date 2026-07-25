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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">Payment received</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your Osiris Audit payment was received. We will use the email from checkout to follow up with intake and fulfillment details.
        </p>
        {sessionId ? (
          <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            Stripe session: {sessionId}
          </p>
        ) : null}
      </div>
    </main>
  );
}
