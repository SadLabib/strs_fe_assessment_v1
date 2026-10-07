// A fixed locale keeps server- and client-rendered text identical (no
// hydration mismatches) and matches the US market the data comes from.
const LOCALE = "en-US";

export const EMPTY = "—";

const currencyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
});

/** Typographic minus reads better than a hyphen in financial figures. */
function withMinusSign(text: string) {
  return text.replace("-", "−");
}

/** Whole dollars: 675000 → "$675,000", -4210 → "−$4,210". */
export function formatCurrency(value: number | null | undefined) {
  if (value == null) return EMPTY;
  return withMinusSign(currencyFormat.format(value));
}

/** 2150 → "2,150", 5.5 → "5.5". */
export function formatNumber(value: number | null | undefined) {
  if (value == null) return EMPTY;
  return withMinusSign(numberFormat.format(value));
}
