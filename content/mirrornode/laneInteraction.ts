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
