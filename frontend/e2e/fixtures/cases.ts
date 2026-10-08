import type { Property } from "./properties";

export type Band = "best" | "medium" | "low";

export const SCORE: Record<Band, number> = { best: 100, medium: 70, low: 40 };

export type ScoringCase = {
  property: Property;
  label: string;
  mid: number;
  band: Band;
};

/**
 * reference × percent ÷ 100 in integer maths. 125000 * 110 / 100 is exactly
 * 137500, while 125000 * 1.1 is 137500.00000000001, which would land on the
 * wrong side of an inclusive boundary.
 */
function percentOf(reference: number, percent: number) {
  const value = (reference * percent) / 100;
  if (!Number.isInteger(value)) {
    throw new Error(
      `${percent}% of ${reference} isn't a whole dollar; pick another case`,
    );
  }
  return value;
}

/** Equivalence partitioning: one clear case inside each band. */
export function bandCases(property: Property): ScoringCase[] {
  const ref = property.referenceMid;
  return [
    { property, label: "4% above", mid: percentOf(ref, 104), band: "best" },
    { property, label: "20% below", mid: percentOf(ref, 80), band: "medium" },
    { property, label: "40% above", mid: percentOf(ref, 140), band: "low" },
  ];
}

/**
 * Boundary values: each band edge exactly (limits count in the trainee's
 * favour, so they stay in the better band) and $1 outside it (drops a band).
 */
export function boundaryCases(property: Property): ScoringCase[] {
  const ref = property.referenceMid;
  return [
    { property, label: "exactly +10%", mid: percentOf(ref, 110), band: "best" },
    {
      property,
      label: "+10% and $1",
      mid: percentOf(ref, 110) + 1,
      band: "medium",
    },
    { property, label: "exactly −10%", mid: percentOf(ref, 90), band: "best" },
    {
      property,
      label: "−10% and $1",
      mid: percentOf(ref, 90) - 1,
      band: "medium",
    },
    {
      property,
      label: "exactly +25%",
      mid: percentOf(ref, 125),
      band: "medium",
    },
    {
      property,
      label: "+25% and $1",
      mid: percentOf(ref, 125) + 1,
      band: "low",
    },
    {
      property,
      label: "exactly −25%",
      mid: percentOf(ref, 75),
      band: "medium",
    },
    {
      property,
      label: "−25% and $1",
      mid: percentOf(ref, 75) - 1,
      band: "low",
    },
  ];
}

/** The ranges the results page should report, from the brief's own table. */
export function bandRanges(property: Property) {
  const ref = property.referenceMid;
  return {
    best: [percentOf(ref, 90), percentOf(ref, 110)],
    medium: [percentOf(ref, 75), percentOf(ref, 125)],
  };
}
