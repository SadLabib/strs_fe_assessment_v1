export const TRAINING_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const RATINGS = ["best", "medium", "low"] as const;
export type Rating = (typeof RATINGS)[number];

export const SCENARIOS = ["low", "mid", "high"] as const;
export type Scenario = (typeof SCENARIOS)[number];

/** Yes/no deal labels, using the API field names. They don't affect the score. */
export const DEAL_TAGS = [
  "turnkey",
  "furnished",
  "luxury",
  "tax_efficient",
  "new_construction",
  "existing_airbnb",
  "arv",
  "high_cash_on_cash",
  "low_cash_on_cash",
  "add_inground_pool",
  "waterfront",
  "remote",
  "can_support_cohost",
] as const;
export type DealTag = (typeof DEAL_TAGS)[number];
