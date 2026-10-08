import { z } from "zod";

import { DEAL_TAGS, type DealTag } from "@/lib/domain";

// Inputs hold text, so the form keeps strings. These schemas validate that
// text and convert it to numbers. Percentages are whole numbers here (20 =
// 20%); mappers.ts converts them to the API's fractions.

const MAX_AMOUNT = 1_000_000_000;
export const MAX_ROWS = 50;
export const MAX_TEXT = 80;

/** "675,000" → 675000. Blank text becomes NaN, never 0. */
export function toNumber(text: string) {
  const cleaned = text.replaceAll(",", "").trim();
  return cleaned === "" ? Number.NaN : Number(cleaned);
}

function numberText(
  label: string,
  check: (schema: z.ZodNumber) => z.ZodNumber,
) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform(toNumber)
    .pipe(check(z.number({ error: `${label} must be a number` })));
}

const positiveAmount = (label: string) =>
  numberText(label, (n) =>
    n
      .gt(0, `${label} must be more than $0`)
      .max(MAX_AMOUNT, `${label} is too large`),
  );

const percent = (label: string) =>
  numberText(label, (n) =>
    n
      .min(0, `${label} can't be negative`)
      .max(100, `${label} can't be more than 100%`),
  );

// ------------------------------------------------------------- financials --

export const purchaseSchema = z.object({
  price: positiveAmount("Purchase price"),
  downPaymentPct: percent("Down payment"),
  interestRatePct: percent("Interest rate"),
  termYears: numberText("Loan term", (n) =>
    n
      .int("Loan term must be whole years")
      .min(1, "Loan term must be at least 1 year")
      .max(50, "Loan term can't be more than 50 years"),
  ),
  closingCostsPct: percent("Closing costs"),
});

/** Problems with one line-item row. A fully blank row is ignored, not an error. */
function rowIssues(name: string, amount: string, nameLabel: string) {
  const hasName = name.trim() !== "";
  const hasAmount = amount.trim() !== "";
  if (!hasName && !hasAmount) return {};

  const value = toNumber(amount);
  let amountIssue: string | undefined;
  if (!hasAmount) amountIssue = "Add an amount";
  else if (!Number.isFinite(value)) amountIssue = "Amount must be a number";
  else if (value < 0) amountIssue = "Amount can't be negative";
  else if (value > MAX_AMOUNT) amountIssue = "Amount is too large";

  return {
    name: hasName ? undefined : `Add a ${nameLabel}`,
    amount: amountIssue,
  };
}

const rowText = z
  .string()
  .max(MAX_TEXT, `Keep it under ${MAX_TEXT} characters`);

export const optimizationItemsSchema = z
  .array(
    z
      .object({ category: rowText, amount: z.string() })
      .superRefine((row, ctx) => {
        const issues = rowIssues(row.category, row.amount, "category");
        if (issues.name)
          ctx.addIssue({
            code: "custom",
            path: ["category"],
            message: issues.name,
          });
        if (issues.amount)
          ctx.addIssue({
            code: "custom",
            path: ["amount"],
            message: issues.amount,
          });
      }),
  )
  .max(MAX_ROWS, `Add up to ${MAX_ROWS} items`);

export const operatingExpensesSchema = z
  .array(
    z
      .object({ name: rowText, monthlyAmount: z.string() })
      .superRefine((row, ctx) => {
        const issues = rowIssues(row.name, row.monthlyAmount, "name");
        if (issues.name)
          ctx.addIssue({
            code: "custom",
            path: ["name"],
            message: issues.name,
          });
        if (issues.amount) {
          ctx.addIssue({
            code: "custom",
            path: ["monthlyAmount"],
            message: issues.amount,
          });
        }
      }),
  )
  .max(MAX_ROWS, `Add up to ${MAX_ROWS} expenses`);

/** "Most training deals use 20%, 25%, 60% and 37%." */
export const TAX_DEFAULTS = {
  landPct: "20",
  slaPct: "25",
  bonusPct: "60",
  taxRatePct: "37",
};

export const taxesSchema = z.object({
  landPct: percent("Land value"),
  slaPct: percent("Short-life assets"),
  bonusPct: percent("Bonus depreciation"),
  taxRatePct: percent("Tax rate"),
});

// --------------------------------------------------------------- analysis --

export const revenueSchema = z
  .object({
    low: positiveAmount("Low revenue"),
    mid: positiveAmount("Mid revenue"),
    high: positiveAmount("High revenue"),
    coHostingFeePct: percent("Co-hosting fee"),
    appreciationPct: percent("Appreciation"),
  })
  .superRefine((revenue, ctx) => {
    if (revenue.low > revenue.mid) {
      ctx.addIssue({
        code: "custom",
        path: ["mid"],
        message: "Mid can't be lower than Low",
      });
    }
    if (revenue.mid > revenue.high) {
      ctx.addIssue({
        code: "custom",
        path: ["high"],
        message: "High can't be lower than Mid",
      });
    }
  });

// -------------------------------------------------------------- deal tags --

const tagsSchema = z.object(
  Object.fromEntries(DEAL_TAGS.map((tag) => [tag, z.boolean()])) as Record<
    DealTag,
    z.ZodBoolean
  >,
);

export const formSchema = z.object({
  purchase: purchaseSchema,
  optimizationItems: optimizationItemsSchema,
  operatingExpenses: operatingExpensesSchema,
  taxes: taxesSchema,
  revenue: revenueSchema,
  tags: tagsSchema,
});

/** What the inputs hold (text). */
export type FormValues = z.input<typeof formSchema>;
