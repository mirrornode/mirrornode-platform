import { describe, expect, it } from "vitest";
import {
  evaluateMatchmakerIntake,
  initialIntake,
  type Intake,
} from "./matchmakerLogic";

const completeFounderWorkflowIntake: Intake = {
  requestSource: "Operator",
  matchingObjective:
    "Route an incoming founder/team request to the correct Mirrornode offer or review lane.",
  availableEvidence:
    "The requester says their AI workflow is fragmented, they use multiple tools, their team is losing track of decisions, and they need operational coherence before scaling.",
  explicitConstraints:
    "No diagnosis. No hidden scoring. No claims about personal traits. Recommend only advisory next steps.",
  disallowedInferenceZones:
    "No psychological, spiritual, medical, legal, political, protected-attribute, or intimate inferences.",
  outputTypeRequested: "Advisory match review",
  reviewAuthority: "Operator review required",
};

describe("matchmaker prototype logic", () => {
  it("routes the local usability proof case to offer alignment with advisory review", () => {
    const output = evaluateMatchmakerIntake(completeFounderWorkflowIntake);

    expect(output).toEqual({
      matchCategory: "offer alignment",
      confidenceLevel: "medium",
      supportingEvidence: completeFounderWorkflowIntake.availableEvidence,
      missingInformation: [],
      disqualifyingConcerns:
        "No disqualifying concern can be cleared automatically. Human review remains required.",
      recommendedNextStep: "Route this advisory output to the declared review authority.",
      reviewGate: "Operator review required",
    });
  });

  it("does not treat incomplete intake as usable advisory output", () => {
    const output = evaluateMatchmakerIntake({
      ...initialIntake,
      matchingObjective: "",
      availableEvidence: "",
    });

    expect(output.confidenceLevel).toBe("insufficient");
    expect(output.supportingEvidence).toBe("No evidence supplied yet.");
    expect(output.missingInformation).toEqual([
      "requestSource",
      "matchingObjective",
      "availableEvidence",
      "explicitConstraints",
    ]);
    expect(output.recommendedNextStep).toBe(
      "Complete the intake fields before relying on this advisory output.",
    );
  });

  it("keeps unknown objectives in a general advisory lane", () => {
    const output = evaluateMatchmakerIntake({
      ...completeFounderWorkflowIntake,
      matchingObjective: "Clarify what kind of review this needs.",
    });

    expect(output.matchCategory).toBe("general advisory match");
    expect(output.reviewGate).toBe("Operator review required");
  });
});
