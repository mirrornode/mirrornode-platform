export type Intake = {
  requestSource: string;
  matchingObjective: string;
  availableEvidence: string;
  explicitConstraints: string;
  disallowedInferenceZones: string;
  outputTypeRequested: string;
  reviewAuthority: string;
};

export type MatchmakerOutput = {
  matchCategory: string;
  confidenceLevel: string;
  supportingEvidence: string;
  missingInformation: string[];
  disqualifyingConcerns: string;
  recommendedNextStep: string;
  reviewGate: string;
};

export const initialIntake: Intake = {
  requestSource: "",
  matchingObjective: "",
  availableEvidence: "",
  explicitConstraints: "",
  disallowedInferenceZones:
    "No hidden psychological labels, spiritual claims, medical/legal/political inferences, protected-attribute assumptions, permanent ranking, or irreversible access decisions.",
  outputTypeRequested: "advisory match review",
  reviewAuthority: "Operator review required",
};

export function confidenceFor(intake: Intake) {
  const filled = Object.values(intake).filter((value) => value.trim().length > 0).length;

  if (filled >= 7) return "medium";
  if (filled >= 4) return "low";
  return "insufficient";
}

export function categoryFor(objective: string) {
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

export function evaluateMatchmakerIntake(intake: Intake): MatchmakerOutput {
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
}
