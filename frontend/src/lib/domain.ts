export const TRAINING_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const RATINGS = ["best", "medium", "low"] as const;
export type Rating = (typeof RATINGS)[number];
