"use client";

import { useState } from "react";

type StageSymbol = "intake" | "lattice" | "evidence" | "findings" | "delivery";

const steps: Array<{
  title: string;
  panelTitle: string;
  symbol: StageSymbol;
  copy: string;
  collapsedSummary: string;
  boundary: string;
  details: string[];
}> = [
  {
    title: "Intake",
    panelTitle: "Declared context",
    symbol: "intake",
    copy: "You share the system context, goals, visible friction, and any documents or screenshots that help explain the current state.",
    collapsedSummary: "Context enters the audit without secrets or credentials.",
    boundary:
      "Do not send secrets, private keys, passwords, or production credentials. The audit starts from declared context only.",
    details: [
      "System summary, goals, concerns, and friction points are collected.",
      "Up to 5 primary artifacts or links are accepted for review.",
      "The first pass separates what is known from what still needs clarification.",
    ],
  },
  {
    title: "Structural Review",
    panelTitle: "Operating shape",
    symbol: "lattice",
    copy: "The system shape is reviewed for roles, handoffs, bottlenecks, authority drift, workflow gaps, and unclear operating boundaries.",
    collapsedSummary: "Roles, handoffs, bottlenecks, and fragile boundaries are traced.",
    boundary:
      "This is review, not implementation. Findings may recommend changes, but no production action is taken.",
    details: [
      "Prompts, agents, docs, automations, and handoffs are read as one operating system.",
      "Load-bearing assumptions and weak transitions are identified.",
      "Authority drift, duplicate lanes, and missing ownership points are surfaced.",
    ],
  },
  {
    title: "Evidence Pass",
    panelTitle: "Source clarity",
    symbol: "evidence",
    copy: "Claims, documents, screenshots, repo notes, and contradictions are separated into confirmed, partial, unknown, or needs-review categories.",
    collapsedSummary: "Claims and artifacts are separated by evidence strength.",
    boundary:
      "Evidence review is source-grounded. It is not legal, compliance, or security certification.",
    details: [
      "Artifacts are checked against the system story they are meant to support.",
      "Contradictions, unsupported claims, and missing source context are marked clearly.",
      "The audit distinguishes confirmed evidence from partial or unknown claims.",
    ],
  },
  {
    title: "Findings",
    panelTitle: "Risk signal",
    symbol: "findings",
    copy: "You receive the clearest risks, strengths, drift points, and opportunities organized into a short, prioritized sequence.",
    collapsedSummary: "The strongest risks and opportunities are pulled into focus.",
    boundary:
      "Recommendations remain advisory until you approve and route any implementation separately.",
    details: [
      "Likely failure modes are named in plain language.",
      "Strengths are preserved so the system is not overcorrected.",
      "Risks are prioritized by clarity, impact, and near-term usefulness.",
    ],
  },
  {
    title: "Delivery",
    panelTitle: "Audit packet",
    symbol: "delivery",
    copy: "The audit is delivered as a concise report with the structural map, findings, and recommended next steps.",
    collapsedSummary: "You receive one structured document with next actions.",
    boundary:
      "Delivery does not grant MIRRORNODE canon approval, registry authority, or automatic remediation.",
    details: [
      "The final document includes system shape, findings, risks, and next actions.",
      "One clarification pass is included for factual issues or missed intake context.",
      "Implementation can be scoped separately after the audit is accepted.",
    ],
  },
];

const deliverables = [
  "Structural map",
  "Risk and drift notes",
  "Prioritized next steps",
  "Service boundary",
];

export default function OsirisAuditSequence() {
  const [selectedStep, setSelectedStep] = useState(0);
  const currentStep = steps[selectedStep];

  return (
    <section className="my-12 overflow-hidden rounded-3xl border border-cyan-400/20 bg-zinc-950/80 p-4 shadow-[0_0_70px_rgba(34,211,238,0.08)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
            State to causality to intervention
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
            Audit sequence
          </h2>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
          {currentStep.title} selected
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
        <div className="relative grid gap-3 sm:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-cyan-400/80 via-emerald-300/70 to-cyan-400/80 sm:block" />

          {steps.map((step, index) => {
            const active = selectedStep === index;

            return (
              <button
                key={step.title}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedStep(index)}
                className={`relative rounded-2xl border p-3 text-left transition sm:text-center ${
                  active
                    ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                    : "border-transparent hover:border-cyan-300/30 hover:bg-cyan-300/5"
                }`}
              >
                <span
                  className={`relative z-10 mb-2 grid h-12 w-12 place-items-center rounded-full border bg-zinc-950 text-sm font-semibold shadow-[0_0_24px_rgba(34,211,238,0.18)] sm:mx-auto ${
                    active
                      ? "border-cyan-200 text-cyan-100"
                      : "border-cyan-300/40 text-cyan-200/80"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="block text-sm font-medium text-zinc-100">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
              Current motion
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              {currentStep.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {currentStep.copy}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">
              Boundary
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              What this stage does not do
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {currentStep.boundary}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Process lanes
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-100">
              Select a lane to expand its audit detail
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            {deliverables.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          {steps.map((step, index) => {
            const active = selectedStep === index;

            return (
              <button
                key={step.panelTitle}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedStep(index)}
                className={`group min-h-[180px] rounded-2xl border p-4 text-left transition-all duration-300 ${
                  active
                    ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.16)] lg:flex-[2.45]"
                    : "border-zinc-800 bg-zinc-950/70 hover:border-cyan-300/30 hover:bg-cyan-300/5 lg:flex-1"
                }`}
              >
                <div className="flex items-start gap-3">
                  <StageSymbolMark symbol={step.symbol} active={active} />

                  <div className="min-w-0">
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${
                        active ? "text-cyan-100" : "text-zinc-600"
                      }`}
                    >
                      Lane {index + 1}
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-zinc-100">
                      {step.panelTitle}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {step.collapsedSummary}
                    </p>
                  </div>
                </div>

                {active ? (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                        Expanded detail
                      </p>
                      <ul className="mt-3 space-y-2">
                        {step.details.map((detail) => (
                          <li
                            key={detail}
                            className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-zinc-300"
                          >
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.55)]" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm leading-6 text-zinc-400">
                      <span className="font-medium text-amber-100/90">
                        Boundary:
                      </span>{" "}
                      {step.boundary}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StageSymbolMark({
  symbol,
  active,
}: {
  symbol: StageSymbol;
  active: boolean;
}) {
  return (
    <span
      className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition ${
        active
          ? "border-cyan-200/70 bg-cyan-300/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.22)]"
          : "border-zinc-800 bg-black/30 text-zinc-500 group-hover:border-cyan-300/30 group-hover:text-cyan-200"
      }`}
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-9 w-9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        {symbol === "intake" ? (
          <>
            <circle cx="24" cy="24" r="12" opacity="0.45" />
            <path d="M8 24h12" />
            <path d="m16 18 6 6-6 6" />
            <path d="M28 14h8v8" opacity="0.55" />
            <path d="M36 14 26 24" opacity="0.55" />
          </>
        ) : null}

        {symbol === "lattice" ? (
          <>
            <rect x="8" y="8" width="10" height="10" rx="2" />
            <rect x="30" y="8" width="10" height="10" rx="2" />
            <rect x="8" y="30" width="10" height="10" rx="2" />
            <rect x="30" y="30" width="10" height="10" rx="2" />
            <path d="M18 13h12M13 18v12M35 18v12M18 35h12" opacity="0.7" />
            <path d="M18 18 30 30M30 18 18 30" opacity="0.45" />
          </>
        ) : null}

        {symbol === "evidence" ? (
          <>
            <path d="M15 10h16l6 6v22H15z" />
            <path d="M31 10v7h6" />
            <path d="M11 15h-1v27h22v-1" opacity="0.5" />
            <path d="M20 23h12M20 29h12M20 35h8" opacity="0.7" />
          </>
        ) : null}

        {symbol === "findings" ? (
          <>
            <path d="M24 6 42 24 24 42 6 24z" />
            <path d="M14 25h6l3-7 5 14 3-7h5" />
            <circle cx="24" cy="24" r="3" opacity="0.55" />
          </>
        ) : null}

        {symbol === "delivery" ? (
          <>
            <rect x="9" y="12" width="30" height="24" rx="4" />
            <path d="m10 16 14 11 14-11" opacity="0.7" />
            <path d="M24 6v12" />
            <path d="m18 12 6 6 6-6" />
            <path d="M16 40h16" opacity="0.55" />
          </>
        ) : null}
      </svg>
    </span>
  );
}
