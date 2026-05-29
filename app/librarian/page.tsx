'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type IngestResponse = {
  success: boolean;
  documentId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  quote: number;
  checkoutTier: 'tier1' | 'tier2' | 'tier3';
  message?: string;
  error?: string;
};

const tierCopy: Record<IngestResponse['checkoutTier'], string> = {
  tier1: 'Basic structural synthesis',
  tier2: 'Standard Osiris audit',
  tier3: 'Full lattice execution',
};

export default function LibrarianPage() {
  const supabase = useMemo(() => createClient(), []);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setError(null);
    setResult(null);

    if (!file) {
      setError('Choose a document first.');
      return;
    }

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('You must be signed in before ingesting a document.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/librarian/ingest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = (await response.json()) as IngestResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data?.error || 'Ingest failed.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingest failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckout = async () => {
    if (!result) return;

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setIsCheckoutLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('You must be signed in before checkout.');
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          documentId: result.documentId,
          severity: result.severity,
          quote: result.quote,
          checkoutTier: result.checkoutTier,
          mode: 'payment',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Checkout initialization failed.');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Librarian</h1>
        <p className="text-sm text-neutral-500">
          Upload a document, run MIRRORNODE triage, and route it into the paid audit path.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />

          <button
            type="button"
            onClick={handleIngest}
            disabled={!file || isUploading}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isUploading ? 'Ingesting…' : 'Ingest document'}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Triage result</h2>
            <p className="text-sm text-neutral-600">{result.message}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Severity</div>
                <div className="mt-1 text-lg font-semibold">{result.severity}</div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Quote</div>
                <div className="mt-1 text-lg font-semibold">${result.quote}</div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Tier</div>
                <div className="mt-1 text-lg font-semibold">{tierCopy[result.checkoutTier]}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isCheckoutLoading
                ? 'Redirecting…'
                : `Continue to checkout — $${result.quote}`}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
