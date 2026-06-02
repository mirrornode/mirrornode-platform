'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type VaultMatch = {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
};

type QueryResponse = {
  ok: boolean;
  query: string;
  namespace: string;
  matches: VaultMatch[];
  error?: string;
};

export default function ThothPage() {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState('librarian');
  const [topK, setTopK] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    setError(null);
    setResult(null);

    if (!query.trim()) {
      setError('Enter a query.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('You must be signed in.');
        return;
      }

      const res = await fetch('/api/thoth/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query, namespace, topK }),
      });

      const data = await res.json() as QueryResponse;

      if (!res.ok) {
        throw new Error(data.error || 'Query failed.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Thoth</h1>
        <p className="text-sm text-neutral-500">
          Semantic retrieval against the MIRRORNODE vault. Ask anything — Thoth finds what matters.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          rows={3}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 mb-1 block">Namespace</label>
            <select
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="librarian">librarian</option>
              <option value="lucian">lucian</option>
              <option value="osiris">osiris</option>
              <option value="thoth">thoth</option>
            </select>
          </div>

          <div className="w-24">
            <label className="text-xs text-neutral-500 mb-1 block">Top K</label>
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuery}
          disabled={!query.trim() || isLoading}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isLoading ? 'Searching…' : 'Query vault'}
        </button>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {result ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            {result.matches.length} result{result.matches.length !== 1 ? 's' : ''} in{' '}
            <span className="font-mono text-sm">{result.namespace}</span>
          </h2>

          {result.matches.length === 0 ? (
            <p className="text-sm text-neutral-500">No matches found. Try a different query or namespace.</p>
          ) : (
            result.matches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-neutral-500">{match.id}</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {(match.score * 100).toFixed(1)}% match
                  </span>
                </div>

                {match.metadata.filename ? (
                  <p className="text-sm font-medium">{String(match.metadata.filename)}</p>
                ) : null}

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                  {match.metadata.severity ? (
                    <span>Severity: <strong>{String(match.metadata.severity)}</strong></span>
                  ) : null}
                  {match.metadata.ingested_at ? (
                    <span>Ingested: {new Date(String(match.metadata.ingested_at)).toLocaleDateString()}</span>
                  ) : null}
                  {match.metadata.bytes ? (
                    <span>Size: {(Number(match.metadata.bytes) / 1024).toFixed(1)} KB</span>
                  ) : null}
                  {match.metadata.paid !== undefined ? (
                    <span>Paid: <strong>{match.metadata.paid ? 'Yes' : 'No'}</strong></span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}
    </main>
  );
}
