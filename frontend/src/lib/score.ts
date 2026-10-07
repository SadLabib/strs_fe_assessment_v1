import type { Submission } from "@/lib/api/schemas";

import { formatPercent } from "./format";

type Breakdown = Submission["breakdown"];

/**
 * Which side of the analyst the trainee landed on. The API's deviation is
 * absolute, so the direction comes from comparing the raw numbers.
 */
export function deviationDirection(
  candidate: number | null,
  reference: number | null,
): "above" | "below" | "exact" | null {
  if (candidate == null || reference == null) return null;
  if (candidate > reference) return "above";
  if (candidate < reference) return "below";
  return "exact";
}

/** "4.0% above the analyst", "matched the analyst exactly", … */
export function describeDeviation({
  candidate,
  reference,
  deviation,
}: Breakdown) {
  const direction = deviationDirection(candidate, reference);
  if (direction === null) return "no Mid forecast to compare";
  if (direction === "exact") return "matched the analyst exactly";
  return `${formatPercent(deviation)} ${direction} the analyst`;
}
