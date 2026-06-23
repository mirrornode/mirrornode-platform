"use client";

import { useMemo, useState } from "react";

type Intake = {
  requestSource: string;
  matchingObjective: string;
  availableEvidence: string;
  explicitConstraints: string;
  disallowedInferenceZones: string;
  outputTypeRequested: string;
  reviewAuthority: string;
};

const initialIntake: Intake = {
  requestSource: "",
  matchingObjective: "",
  availableEvidence: "",
  explicitConstraints: "",
  disallowedInferenceZones:
    "No hidden psychological labels, spiritual claims, medical/legal/political inferences, protected-attribute assumptions, permanent ranking, or irreversible access decisions.",
  outputTypeRequested: "advisory match review",
  reviewAuthority: "Operator review required",
};

function confidenceFor(intake: Intake) {
  const filled = Object.values(intake).filter((value) => value.trim().length > 0).length;

  if (filled >= 7) return "medium";
  if (filled >= 4) return "low";
  return "insufficient";
}

function categoryFor(objective: string) {
  const text = objective.toLowerCase();

  if (text.includes("offer") || text.includes("customer") || text.includes("service")) {
    return "offer alignment";
  }

  if (text.includes("repo") || text.includes("repository") || text.includes("workstream")) {
    return "workstream routing";
  }

  if (text.includes("access") || text.includes("responsibility") || text.includes("covenant")) {
    return "responsibility/access review";
  }

  if (text.includes("node") || text.includes("system") || text.includes("problem")) {
    return "node/review-lane routing";
  }

  return "general advisory match";
}

export default function MatchmakerPrototype() {
  const [intake, setIntake] = useState<Intake>(initialIntake);

  const output = useMemo(() => {
    const confidence = confidenceFor(intake);

    return {
      matchCategory: categoryFor(intake.matchingObjective),
      confidenceLevel: confidence,
      supportingEvidence: intake.availableEvidence.trim()
        ? intake.availableEvidence
        : "No evidence supplied yet.",
      missingInformation: Object.entries(intake)
        .filter(([, value]) => value.trim().length === 0)
        .map(([key]) => key),
      disqualifyingConcerns:
        "No disqualifying concern can be cleared automatically. Human review remains required.",
      recommendedNextStep:
        confidence === "insufficient"
          ? "Complete the intake fields before relying on this advisory output."
          : "Route this advisory output to the declared review authority.",
      reviewGate: intake.reviewAuthority || "Operator review required",
    };
  }, [intake]);

  function updateField(field: keyof Intake, value: string) {
    setIntake((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="rounded-2xl border p-6">
        <p className="text-sm uppercase tracking-wide opacity-70">Internal / Matchmaker</p>
        <h1 className="mt-2 text-3xl font-semibold">Matchmaker Prototype</h1>
        <p className="mt-3 max-w-3xl opacity-80">
          Private advisory intake surface. No database writes. No public claims. No hidden scoring.
          Every output remains subject to human review.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Declared Inputs</h2>

          {(
            [
              ["requestSource", "Request source"],
              ["matchingObjective", "Matching objective"],
              ["availableEvidence", "Available evidence"],
              ["explicitConstraints", "Explicit constraints"],
              ["disallowedInferenceZones", "Disallowed inference zones"],
              ["outputTypeRequested", "Output type requested"],
              ["reviewAuthority", "Review authority"],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="mt-5 block">
              <span className="text-sm font-medium">{label}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border bg-transparent p-3 text-sm"
                value={intake[field]}
                onChange={(event) => updateField(field, event.target.value)}
              />
            </label>
          ))}
        </form>

        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Advisory Output</h2>

          <div className="mt-5 space-y-4 text-sm">
            <OutputRow label="Match category" value={output.matchCategory} />
            <OutputRow label="Confidence level" value={output.confidenceLevel} />
            <OutputRow label="Supporting evidence" value={output.supportingEvidence} />
            <OutputRow
              label="Missing information"
              value={
                output.missingInformation.length
                  ? output.missingInformation.join(", ")
                  : "None from declared intake shape."
              }
            />
            <OutputRow label="Disqualifying concerns" value={output.disqualifyingConcerns} />
            <OutputRow label="Recommended next step" value={output.recommendedNextStep} />
            <OutputRow label="Review gate" value={output.reviewGate} />
          </div>

          <div className="mt-6 rounded-xl border p-4 text-sm opacity-80">
            Advisory only. This prototype does not persist data, infer protected attributes,
            generate permanent scores, or override Operator, Theia, THOTH, or security review.
          </div>
        </section>
      </section>
    </main>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-medium">{label}</div>
      <div className="mt-1 whitespace-pre-wrap opacity-80">{value}</div>
    </div>
  );
}
