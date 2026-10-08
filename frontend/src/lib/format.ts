// A fixed locale and time zone keep server- and client-rendered text identical
// (no hydration mismatches). The data and the team are US-based (Central time).
const LOCALE = "en-US";
const TIME_ZONE = "America/Chicago";

export const EMPTY = "—";

const currencyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
});

const percentFormat = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
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

/** For narrow spaces: 102800 → "$102.8k", -4210 → "−$4.2k", 950 → "$950". */
export function formatCompactCurrency(value: number | null | undefined) {
  if (value == null) return EMPTY;
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs < 1_000) return `${sign}$${Math.round(abs)}`;
  return `${sign}$${(abs / 1_000).toFixed(1)}k`;
}

/** 2150 → "2,150", 5.5 → "5.5". */
export function formatNumber(value: number | null | undefined) {
  if (value == null) return EMPTY;
  return withMinusSign(numberFormat.format(value));
}

/** Fractions, as the API sends them: 0.0412 → "4.1%". */
export function formatPercent(fraction: number | null | undefined) {
  if (fraction == null) return EMPTY;
  return withMinusSign(percentFormat.format(fraction));
}

/** ISO timestamp → "Oct 8, 2026, 12:27 AM CDT". */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return EMPTY;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? EMPTY : dateTimeFormat.format(date);
}

/** API enum → label: "SINGLE_FAMILY" → "Single family". */
export function humanize(value: string | null | undefined) {
  if (!value) return EMPTY;
  const words = value.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
