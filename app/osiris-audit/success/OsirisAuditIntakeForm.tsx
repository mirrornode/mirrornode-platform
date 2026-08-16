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
      <section className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]" aria-live="polite">
        <div className="border-b border-cyan-300/15 bg-cyan-300/[0.04] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
                MOPCON / Engagement state
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Intake received</h2>
            </div>
            <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-emerald-200">
              Queued for review
            </span>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Payment</dt>
              <dd className="mt-2 text-sm font-medium text-white">Confirmed</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Intake</dt>
              <dd className="mt-2 text-sm font-medium text-white">Recorded</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Audit status</dt>
              <dd className="mt-2 text-sm font-medium text-white">Queued for review</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/40">Target delivery</dt>
              <dd className="mt-2 text-sm font-medium text-white">Within 3 business days</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5">
            <p className="text-sm font-semibold tracking-wide text-cyan-100">
              Secure access. Distinctive delivery. Uncompromising service.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Your purchase has opened a bounded MIRRORNODE engagement. Osiris will review the submitted system context and authorized references, while MOPCON provides the engagement surface for status, evidence, priority actions, boundary notes, and delivery.
            </p>
          </div>

          <div className="mt-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">What happens next</p>
            <h3 className="mt-2 text-lg font-semibold text-white">No further action is required unless we contact you.</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              MIRRORNODE reviews the submitted system context and authorized references. If clarification or additional access is required, we’ll contact the email used at checkout. Otherwise, no further action is required until delivery.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Engagement status',
              'Osiris findings',
              'Evidence references',
              'Priority actions',
              'Boundary / risk notes',
              'Delivered report',
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8" onSubmit={handleSubmit}>
      <section className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 text-sm leading-6 text-white/65">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Secure intake boundary</p>
        <h2 className="mt-2 font-semibold text-white">Before you submit</h2>
        <p className="mt-2">
          Provide only material you are authorized to share. Do not include production credentials, customer databases, end-user data, or secret values. This intake accepts public or otherwise authorized references only. Private source will not be sent to a third-party AI service without separate, explicit authorization recorded for the engagement.
        </p>
      </section>

      <div>
        <label htmlFor="system-summary" className="block text-sm font-medium text-white">System or workflow summary</label>
        <p className="mt-1 text-xs text-white/40">Describe what the system does, who uses it, and its main components.</p>
        <textarea id="system-summary" name="systemSummary" required minLength={10} maxLength={4000} rows={6} value={systemSummary} onChange={(event) => setSystemSummary(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
      </div>

      <div>
        <label htmlFor="primary-goal" className="block text-sm font-medium text-white">Primary goal</label>
        <p className="mt-1 text-xs text-white/40">What should this audit help you understand or improve?</p>
        <textarea id="primary-goal" name="primaryGoal" required minLength={10} maxLength={2000} rows={4} value={primaryGoal} onChange={(event) => setPrimaryGoal(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
      </div>

      <div>
        <label htmlFor="concerns" className="block text-sm font-medium text-white">Concerns</label>
        <p className="mt-1 text-xs text-white/40">List the risks, drift, bottlenecks, or unclear boundaries you want examined.</p>
        <textarea id="concerns" name="concerns" required maxLength={4000} rows={5} value={concerns} onChange={(event) => setConcerns(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
      </div>

      <div>
        <label htmlFor="artifact-links" className="block text-sm font-medium text-white">Artifact or repository links</label>
        <p className="mt-1 text-xs text-white/40">Optional. Add one complete URL per line, up to 5. Identify the exact commit or reviewed ref where possible.</p>
        <textarea id="artifact-links" name="artifactLinks" rows={5} value={artifactLinksText} onChange={(event) => setArtifactLinksText(event.target.value)} aria-describedby="artifact-link-count" className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
        <p id="artifact-link-count" className={`mt-1 text-xs ${artifactLinks.length > 5 ? 'text-red-300' : 'text-white/40'}`}>{artifactLinks.length} / 5 links</p>
      </div>

      <div>
        <label htmlFor="additional-context" className="block text-sm font-medium text-white">Additional context and scope boundary</label>
        <p className="mt-1 text-xs text-white/40">Optional constraints, deployment target, history, deadlines, terminology, and which repositories, directories, or services are explicitly in or out.</p>
        <textarea id="additional-context" name="additionalContext" maxLength={4000} rows={4} value={additionalContext} onChange={(event) => setAdditionalContext(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <button type="submit" disabled={isSubmitting || artifactLinks.length > 5} className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-200 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Submitting intake...' : 'Submit audit intake'}
      </button>
    </form>
  );
}
