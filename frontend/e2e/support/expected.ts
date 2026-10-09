// Expected text is built independently of the app's own formatters, so a
// formatting bug in the app can't make a test pass by accident.

const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** 130000 → "$130,000" */
export const usd = (value: number) => usdFormat.format(value);

/** How the results page should describe a forecast against the analyst's. */
export function expectedComparison(mid: number, reference: number) {
  if (mid === reference) return `matched the analyst's exactly`;
  const percent = ((Math.abs(mid - reference) / reference) * 100).toFixed(1);
  const direction = mid > reference ? "above" : "below";
  return `was ${percent}% ${direction} the analyst's ${usd(reference)}`;
}

/** How each band's explanation ends, after the comparison. */
const BAND_ENDING = {
  best: ", inside the ±10% band for Best.",
  medium: ". That's within ±25% (Medium); within ±10% would have scored 100.",
  low: ", more than 25% away (Low).",
} as const;

/** The full sentence the results page should show for a graded forecast. */
export function expectedExplanation(
  mid: number,
  reference: number,
  band: keyof typeof BAND_ENDING,
) {
  return `Your Mid forecast of ${usd(mid)} ${expectedComparison(mid, reference)}${BAND_ENDING[band]}`;
}

export const BAND_LABEL = {
  best: "Best",
  medium: "Medium",
  low: "Low",
} as const;
