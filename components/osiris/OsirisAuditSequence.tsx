"use client";

import { useState } from "react";
import OsirisRuntimeAdapterPanel from "./OsirisRuntimeAdapterPanel";

type StageSymbol = "intake" | "scan" | "evidence" | "findings" | "delivery";

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
    panelTitle: "Scope lock",
    symbol: "intake",
    copy: "You provide the system summary, goals, visible friction, and up to 5 artifacts or links for review.",
    collapsedSummary: "The audit starts by locking what is in scope.",
    boundary:
      "No secrets, private keys, passwords, or production credentials are requested.",
    details: [
      "Collect system summary, goals, concerns, and friction points.",
      "Accept up to 5 primary artifacts or links.",
      "Separate declared context from anything that still needs clarification.",
    ],
  },
  {
    title: "Structure Scan",
    panelTitle: "System shape",
    symbol: "scan",
    copy: "Osiris reviews the operating shape: tools, agents, prompts, docs, automations, handoffs, and ownership gaps.",
    collapsedSummary: "The system is read as an operating stack.",
    boundary:
      "This is diagnostic review, not implementation or production intervention.",
    details: [
      "Trace roles, handoffs, bottlenecks, and duplicate lanes.",
      "Identify fragile transitions and missing ownership points.",
      "Mark where more tools would increase confusion instead of capability.",
    ],
  },
  {
    title: "Evidence Review",
    panelTitle: "Proof trail",
    symbol: "evidence",
    copy: "Claims and artifacts are sorted by evidence strength so the final report does not blur confirmed facts with assumptions.",
    collapsedSummary: "Claims are checked against supplied evidence.",
    boundary:
      "Evidence review is not legal, compliance, or security certification.",
    details: [
      "Compare artifacts against the system story they are meant to support.",
      "Mark contradictions, missing context, and unsupported claims.",
      "Separate confirmed, partial, unknown, and needs-review items.",
    ],
  },
  {
    title: "Findings",
    panelTitle: "Risk signal",
    symbol: "findings",
    copy: "The clearest strengths, risks, drift points, and near-term fixes are organized into a prioritized sequence.",
    collapsedSummary: "The strongest risks and opportunities are pulled forward.",
    boundary:
      "Recommendations remain advisory until implementation is separately approved and scoped.",
    details: [
      "Name likely failure modes in plain language.",
      "Preserve strengths so the system is not overcorrected.",
      "Prioritize risks by clarity, impact, and near-term usefulness.",
    ],
  },
  {
    title: "Delivery",
    panelTitle: "Audit packet",
    symbol: "delivery",
    copy: "You receive one structured report with the system shape, findings, risk notes, and recommended next actions.",
    collapsedSummary: "The final output is a usable audit document.",
    boundary:
      "Delivery does not include automatic remediation, canon approval, or ongoing consulting.",
    details: [
      "Deliver the final document with map, findings, risks, and next actions.",
      "Include one clarification pass for factual issues or missed intake context.",
      "Scope any implementation separately after the audit is accepted.",
    ],
  },
];

const deliverables = [
  "System map",
  "Risk notes",
  "Next actions",
  "Boundary summary",
];

export default function OsirisAuditSequence() {
  const [selectedStep, setSelectedStep] = useState(0);
  const currentStep = steps[selectedStep];

  return (
    <section className="my-12 overflow-hidden rounded-3xl border border-amber-300/20 bg-zinc-950/85 p-4 shadow-[0_0_80px_rgba(245,158,11,0.09)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">
            Osiris HUD
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
            How the audit moves
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            A controlled diagnostic sequence from intake to delivery. Each stage
            has a job, a boundary, and a clear output.
          </p>
        </div>
        <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-100">
          {currentStep.title}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/30 p-4 sm:p-5">
        <div className="relative grid gap-3 sm:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-amber-300/80 via-cyan-300/70 to-emerald-300/80 sm:block" />

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
                    ? "border-amber-300/60 bg-amber-300/10 shadow-[0_0_28px_rgba(245,158,11,0.16)]"
                    : "border-transparent hover:border-amber-300/30 hover:bg-amber-300/5"
                }`}
              >
                <span
                  className={`relative z-10 mb-2 grid h-12 w-12 place-items-center rounded-full border bg-zinc-950 text-sm font-semibold shadow-[0_0_24px_rgba(245,158,11,0.16)] sm:mx-auto ${
                    active
                      ? "border-amber-200 text-amber-100"
                      : "border-amber-300/35 text-amber-200/75"
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
              Selected stage
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              {currentStep.panelTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {currentStep.copy}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
              Boundary
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              What stays outside this audit
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
              Diagnostic lanes
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-100">
              Click a stage to see what is actually reviewed
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
                    ? "border-amber-300/60 bg-amber-300/10 shadow-[0_0_34px_rgba(245,158,11,0.16)] lg:flex-[2.45]"
                    : "border-zinc-800 bg-zinc-950/70 hover:border-amber-300/30 hover:bg-amber-300/5 lg:flex-1"
                }`}
              >
                <div className="flex items-start gap-3">
                  <StageSymbolMark symbol={step.symbol} active={active} />

                  <div className="min-w-0">
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${
                        active ? "text-amber-100" : "text-zinc-600"
                      }`}
                    >
                      Stage {index + 1}
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
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">
                        Review detail
                      </p>
                      <ul className="mt-3 space-y-2">
                        {step.details.map((detail) => (
                          <li
                            key={detail}
                            className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-zinc-300"
                          >
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)]" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm leading-6 text-zinc-400">
                      <span className="font-medium text-cyan-100/90">
                        Guardrail:
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

      <OsirisRuntimeAdapterPanel />
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
          ? "border-amber-200/70 bg-amber-300/15 text-amber-100 shadow-[0_0_28px_rgba(245,158,11,0.22)]"
          : "border-zinc-800 bg-black/30 text-zinc-500 group-hover:border-amber-300/30 group-hover:text-amber-200"
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

        {symbol === "scan" ? (
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
