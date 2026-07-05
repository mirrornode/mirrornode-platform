"use client";

import { useState } from "react";

const steps = [
  {
    title: "Intake",
    copy: "You share the system context, goals, visible friction, and any documents or screenshots that help explain the current state.",
    boundary:
      "Do not send secrets, private keys, passwords, or production credentials. The audit starts from declared context only.",
  },
  {
    title: "Structural Review",
    copy: "The system shape is reviewed for roles, handoffs, bottlenecks, authority drift, workflow gaps, and unclear operating boundaries.",
    boundary:
      "This is review, not implementation. Findings may recommend changes, but no production action is taken.",
  },
  {
    title: "Evidence Pass",
    copy: "Claims, documents, screenshots, repo notes, and contradictions are separated into confirmed, partial, unknown, or needs-review categories.",
    boundary:
      "Evidence review is source-grounded. It is not legal, compliance, or security certification.",
  },
  {
    title: "Findings",
    copy: "You receive the clearest risks, strengths, drift points, and opportunities organized into a short, prioritized sequence.",
    boundary:
      "Recommendations remain advisory until you approve and route any implementation separately.",
  },
  {
    title: "Delivery",
    copy: "The audit is delivered as a concise report with the structural map, findings, and recommended next steps.",
    boundary:
      "Delivery does not grant MIRRORNODE canon approval, registry authority, or automatic remediation.",
  },
];

const deliverables = [
  {
    title: "Structural map",
    copy: "System shape, roles, handoffs, and visible friction.",
  },
  {
    title: "Risk and drift notes",
    copy: "Where authority, evidence, execution, or scope may be unclear.",
  },
  {
    title: "Prioritized next steps",
    copy: "A short sequence of actions that can be reviewed before implementation.",
  },
  {
    title: "Service boundary",
    copy: "Commercial review only. No certification, legal assurance, or automatic remediation.",
    boundary: true,
  },
];

export default function OsirisAuditSequence() {
  const [selectedStep, setSelectedStep] = useState(0);
  const currentStep = steps[selectedStep];

  return (
    <section className="my-12 overflow-hidden rounded-2xl border border-cyan-400/20 bg-zinc-950/80 p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4 text-xs uppercase tracking-[0.22em] text-cyan-200/80">
            <span>State to causality to intervention</span>
            <span>{currentStep.title} selected</span>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-5">
            <div className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-400 sm:block" />
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                aria-pressed={selectedStep === index}
                onClick={() => setSelectedStep(index)}
                className="relative rounded-xl border border-transparent p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/5 aria-pressed:border-cyan-300/50 aria-pressed:bg-cyan-300/10 sm:text-center"
              >
                <span className="relative z-10 mb-2 grid h-10 w-10 place-items-center rounded-full border border-cyan-300/50 bg-zinc-950 text-sm text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.2)] sm:mx-auto">
                  {index + 1}
                </span>
                <span className="block text-sm font-medium text-zinc-100">
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="text-lg font-semibold text-zinc-100">
                {currentStep.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{currentStep.copy}</p>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
              <h3 className="text-lg font-semibold text-zinc-100">Boundary</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {currentStep.boundary}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
          <div className="border-b border-zinc-800 pb-4 text-xs uppercase tracking-[0.22em] text-zinc-500">
            What you receive
          </div>
          <div className="mt-5 space-y-3">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className={`grid grid-cols-[auto_1fr] gap-3 rounded-xl border p-3 ${
                  item.boundary
                    ? "border-amber-300/20 bg-amber-300/5"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.45)]" />
                <span>
                  <strong className="block text-sm font-medium text-zinc-100">
                    {item.title}
                  </strong>
                  <span className="text-sm text-zinc-500">{item.copy}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <span className="block text-xs uppercase tracking-[0.18em] text-zinc-600">
              Review service
            </span>
            Included
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.18em] text-zinc-600">
              Implementation
            </span>
            Not included
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.18em] text-zinc-600">
              Certification
            </span>
            Not promised
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.18em] text-zinc-600">
              Canon authority
            </span>
            Not granted
          </div>
        </div>
      </div>
    </section>
  );
}
