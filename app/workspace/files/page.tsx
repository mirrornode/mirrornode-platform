'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type WorkspaceIngestResponse = {
  success: boolean;
  mode: 'workspace';
  documentId: string;
  filename: string;
  bytes: number;
  ingestedAt: string;
  message: string;
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WorkspaceFilesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [file, setFile] = useState<File | null>(null);
  const [processingAuthorized, setProcessingAuthorized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<WorkspaceIngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setError(null);
    setResult(null);

    if (!file) {
      setError('Choose a working document first.');
      return;
    }

    if (!processingAuthorized) {
      setError('Confirm the processing boundary before indexing.');
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
        setError('You must be signed in before indexing working material.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'workspace');

      const response = await fetch('/api/librarian/ingest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = (await response.json()) as WorkspaceIngestResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Workspace ingest failed.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workspace ingest failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <nav className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Operator Workspace
        </Link>
        <Link href="/thoth" className="text-sm text-neutral-500 hover:text-neutral-900">
          Search with Thoth →
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
          Operator / Working Files
        </p>
        <h1 className="text-3xl font-semibold">Index working material</h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-500">
          Add authorized text-based working material to your user-scoped
          MIRRORNODE retrieval space, then search it through Thoth.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Working document
            </label>
            <input
              type="file"
              accept=".txt,.md,.markdown,.json,.csv,text/plain,text/markdown,text/csv,application/json"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
                setError(null);
              }}
              className="block w-full text-sm"
            />
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Slice 2A accepts text, Markdown, CSV, and JSON. PDF, Office, image,
              and other binary extraction are not represented as supported yet.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="flex items-start gap-3 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={processingAuthorized}
                onChange={(event) => setProcessingAuthorized(event.target.checked)}
                className="mt-1"
              />
              <span>
                I am authorized to process this material. I understand extracted
                text is sent to the configured OpenAI embedding service and its
                vector and metadata are stored in the configured Pinecone vault
                for retrieval.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleIngest}
            disabled={!file || !processingAuthorized || isUploading}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isUploading ? 'Indexing…' : 'Index working document'}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="space-y-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-emerald-700">
                Indexed
              </p>
              <h2 className="mt-1 text-xl font-semibold">{result.filename}</h2>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Document ID</dt>
                <dd className="break-all font-mono text-xs">{result.documentId}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Indexed size</dt>
                <dd>{formatBytes(result.bytes)}</dd>
              </div>
            </dl>

            <p className="text-sm leading-6 text-neutral-600">
              {result.message}
            </p>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-5 text-neutral-500">
              This slice indexes extracted text for retrieval. It does not retain
              the original file bytes and therefore does not yet provide source-file
              download or export.
            </div>

            <Link
              href="/thoth"
              className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Search indexed material with Thoth →
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
