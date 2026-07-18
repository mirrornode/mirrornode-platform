import type { ExposureState } from "./types";

export const laneInteractionStates = [
  "unselected",
  "selected",
  "boundary-required",
  "acknowledged",
  "blocked",
  "invalid",
] as const;

export type LaneInteractionState = (typeof laneInteractionStates)[number];

export type LaneInteractionRecord = {
  slug: string;
  exposureState: ExposureState;
  requiresAcknowledgement?: boolean;
};

export type LaneInteractionModel = {
  selectedSlug: string | null;
  acknowledgedSlug: string | null;
};

export type LaneInteractionAction =
  | { type: "select"; slug: string }
  | { type: "acknowledge" }
  | { type: "clear" };

export const initialLaneInteractionModel: LaneInteractionModel = {
  selectedSlug: null,
  acknowledgedSlug: null,
};

export function laneInteractionReducer(
  model: LaneInteractionModel,
  action: LaneInteractionAction,
): LaneInteractionModel {
  switch (action.type) {
    case "select":
      return {
        selectedSlug: action.slug,
        acknowledgedSlug:
          model.selectedSlug === action.slug ? model.acknowledgedSlug : null,
      };
    case "acknowledge":
      return model.selectedSlug
        ? { ...model, acknowledgedSlug: model.selectedSlug }
        : model;
    case "clear":
      return initialLaneInteractionModel;
  }
}

export function deriveLaneInteractionState(
  record: LaneInteractionRecord | null | undefined,
  model: LaneInteractionModel,
): LaneInteractionState {
  if (!model.selectedSlug) {
    return "unselected";
  }

  if (!record || record.slug !== model.selectedSlug) {
    return "invalid";
  }

  if (
    record.exposureState === "deferred" ||
    record.exposureState === "internal-only"
  ) {
    return "blocked";
  }

  if (record.requiresAcknowledgement) {
    return model.acknowledgedSlug === record.slug
      ? "acknowledged"
      : "boundary-required";
  }

  return "selected";
}
