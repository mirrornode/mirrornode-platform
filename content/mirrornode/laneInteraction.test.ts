import { describe, expect, it } from "vitest";
import {
  deriveLaneInteractionState,
  initialLaneInteractionModel,
  laneInteractionReducer,
  type LaneInteractionModel,
  type LaneInteractionRecord,
} from "./laneInteraction";

const publicLane: LaneInteractionRecord = {
  slug: "overview",
  exposureState: "static",
};

const gatedLane: LaneInteractionRecord = {
  slug: "audit",
  exposureState: "reviewed",
  requiresAcknowledgement: true,
};

const blockedLane: LaneInteractionRecord = {
  slug: "agent-stack",
  exposureState: "deferred",
  requiresAcknowledgement: true,
};

describe("lane interaction state", () => {
  it("starts unselected", () => {
    expect(
      deriveLaneInteractionState(undefined, initialLaneInteractionModel),
    ).toBe("unselected");
  });

  it("selects a public lane without inventing a loading state", () => {
    const model = laneInteractionReducer(initialLaneInteractionModel, {
      type: "select",
      slug: publicLane.slug,
    });

    expect(deriveLaneInteractionState(publicLane, model)).toBe("selected");
  });

  it("requires acknowledgement before permitting a gated lane", () => {
    const selected = laneInteractionReducer(initialLaneInteractionModel, {
      type: "select",
      slug: gatedLane.slug,
    });
    expect(deriveLaneInteractionState(gatedLane, selected)).toBe(
      "boundary-required",
    );

    const acknowledged = laneInteractionReducer(selected, {
      type: "acknowledge",
    });
    expect(deriveLaneInteractionState(gatedLane, acknowledged)).toBe(
      "acknowledged",
    );
  });

  it("fails deferred and internal-only lanes closed", () => {
    const selected: LaneInteractionModel = {
      selectedSlug: blockedLane.slug,
      acknowledgedSlug: blockedLane.slug,
    };

    expect(deriveLaneInteractionState(blockedLane, selected)).toBe("blocked");
    expect(
      deriveLaneInteractionState(
        { ...blockedLane, exposureState: "internal-only" },
        selected,
      ),
    ).toBe("blocked");
  });

  it("marks an unresolved selected record invalid", () => {
    expect(
      deriveLaneInteractionState(undefined, {
        selectedSlug: "missing-lane",
        acknowledgedSlug: null,
      }),
    ).toBe("invalid");
  });

  it("clears acknowledgement when selection changes", () => {
    const acknowledged: LaneInteractionModel = {
      selectedSlug: gatedLane.slug,
      acknowledgedSlug: gatedLane.slug,
    };
    const switched = laneInteractionReducer(acknowledged, {
      type: "select",
      slug: publicLane.slug,
    });

    expect(switched).toEqual({
      selectedSlug: publicLane.slug,
      acknowledgedSlug: null,
    });
  });
});
