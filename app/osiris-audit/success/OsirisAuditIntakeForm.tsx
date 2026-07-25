'use client';

import { useState, type FormEvent } from 'react';

type IntakeResponse = {
  accepted?: boolean;
  fulfillmentStatus?: string;
  error?: string;
};

type OsirisAuditIntakeFormProps = {
  sessionId: string;
};

export default function OsirisAuditIntakeForm({
  sessionId,
}: OsirisAuditIntakeFormProps) {
  const [systemSummary, setSystemSummary] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [concerns, setConcerns] = useState('');
  const [artifactLinksText, setArtifactLinksText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artifactLinks = artifactLinksText
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (artifactLinks.length > 5) {
      setError('Provide no more than 5 artifact or repository links.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/osiris-audit/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          systemSummary,
          primaryGoal,
          concerns,
          artifactLinks,
          additionalContext,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as IntakeResponse;

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            'This intake was already submitted or fulfillment has already begun.'
          );
        }

        throw new Error(data.error || 'We could not save your intake.');
      }

      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not save your intake. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <section
        className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6"
        aria-live="polite"
      >
        <h2 className="text-xl font-semibold text-emerald-950">
          Intake received
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Your audit context is now recorded. Target delivery is 3 business
          days after complete intake. We will contact the email used at checkout
          if a clarification is needed.
        </p>
      </section>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="system-summary"
          className="block text-sm font-medium text-neutral-900"
        >
          System or workflow summary
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Describe what the system does, who uses it, and its main components.
        </p>
        <textarea
          id="system-summary"
          name="systemSummary"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          value={systemSummary}
          onChange={(event) => setSystemSummary(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label
          htmlFor="primary-goal"
          className="block text-sm font-medium text-neutral-900"
        >
          Primary goal
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          What should this audit help you understand or improve?
        </p>
        <textarea
          id="primary-goal"
          name="primaryGoal"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={primaryGoal}
          onChange={(event) => setPrimaryGoal(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label
          htmlFor="concerns"
          className="block text-sm font-medium text-neutral-900"
        >
          Concerns
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          List the risks, drift, bottlenecks, or unclear boundaries you want
          examined.
        </p>
        <textarea
          id="concerns"
          name="concerns"
          required
          maxLength={4000}
          rows={5}
          value={concerns}
          onChange={(event) => setConcerns(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      <div>
        <label
          htmlFor="artifact-links"
          className="block text-sm font-medium text-neutral-900"
        >
          Artifact or repository links
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Optional. Add one complete URL per line, up to 5. Only provide
          material you are authorized to share.
        </p>
        <textarea
          id="artifact-links"
          name="artifactLinks"
          rows={5}
          value={artifactLinksText}
          onChange={(event) => setArtifactLinksText(event.target.value)}
          aria-describedby="artifact-link-count"
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200"
        />
        <p
          id="artifact-link-count"
          className={`mt-1 text-xs ${
            artifactLinks.length > 5 ? 'text-red-700' : 'text-neutral-500'
          }`}
        >
          {artifactLinks.length} / 5 links
        </p>
      </div>

      <div>
        <label
          htmlFor="additional-context"
          className="block text-sm font-medium text-neutral-900"
        >
          Additional context
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Optional constraints, history, deadlines, or terminology that will
          help the review.
        </p>
        <textarea
          id="additional-context"
          name="additionalContext"
          maxLength={4000}
          rows={4}
          value={additionalContext}
          onChange={(event) => setAdditionalContext(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || artifactLinks.length > 5}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting intake...' : 'Submit audit intake'}
      </button>
    </form>
  );
}
