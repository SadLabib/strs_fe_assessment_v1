import type { UnderwritingPayload } from "@/lib/api/payload";
import type { Underwriting } from "@/lib/api/schemas";
import { calculateFinancing, type CalcInput } from "@/lib/calc/underwriting";
import { DEAL_TAGS, type DealTag } from "@/lib/domain";

import {
  operatingExpensesSchema,
  optimizationItemsSchema,
  purchaseSchema,
  revenueSchema,
  TAX_DEFAULTS,
  taxesSchema,
  toNumber,
  type FormValues,
} from "./schema";

// The only place where the form's whole-number percentages (20) meet the
// API's fractions (0.2). Rounding hides float noise: 0.07 * 100 is
// 7.000000000000001 in JavaScript.

/** 0.0699 → "6.99". */
export function fractionToPercentText(fraction: number | null | undefined) {
  if (fraction == null) return "";
  return String(Number((fraction * 100).toFixed(4)));
}

/** 6.99 → "0.0699". A string, so no float noise is sent to the API. */
export function percentToFractionText(percent: number) {
  return String(Number((percent / 100).toFixed(6)));
}

function amountText(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

/** Saved draft → form values. New drafts get the listing price and the training tax defaults. */
export function toFormValues(underwriting: Underwriting): FormValues {
  const purchase = underwriting.detail?.purchase_details;
  const revenue = underwriting.detail?.forecasted_revenue;
  const taxes =
    underwriting.taxes?.land_assumptions_pct != null
      ? underwriting.taxes
      : null;

  return {
    purchase: {
      price: amountText(
        purchase?.purchase_price ?? underwriting.purchase_price,
      ),
      downPaymentPct: fractionToPercentText(purchase?.down_payment_pct),
      interestRatePct: fractionToPercentText(purchase?.interest_rate),
      termYears: amountText(purchase?.mortgage_years),
      closingCostsPct: fractionToPercentText(purchase?.closing_costs_pct),
    },
    optimizationItems: underwriting.optimization_items.map((item) => ({
      category: item.category ?? "",
      amount: amountText(item.total_price),
    })),
    operatingExpenses: underwriting.operating_expenses.map((expense) => ({
      name: expense.expense_name ?? "",
      monthlyAmount: amountText(expense.monthly_amount),
    })),
    taxes: taxes
      ? {
          landPct: fractionToPercentText(taxes.land_assumptions_pct),
          slaPct: fractionToPercentText(taxes.sla_multiplier_pct),
          bonusPct: fractionToPercentText(taxes.bonus_amount_pct),
          taxRatePct: fractionToPercentText(taxes.tax_rate_pct),
        }
      : { ...TAX_DEFAULTS },
    revenue: {
      low: amountText(revenue?.scenarios.low.forecasted_revenue),
      mid: amountText(revenue?.scenarios.mid.forecasted_revenue),
      high: amountText(revenue?.scenarios.high.forecasted_revenue),
      coHostingFeePct: revenue
        ? fractionToPercentText(revenue.co_hosting_fee_pct)
        : "0",
      appreciationPct: revenue
        ? fractionToPercentText(revenue.annual_re_appreciation_pct)
        : "",
    },
    tags: Object.fromEntries(
      DEAL_TAGS.map((tag) => [tag, underwriting[tag] ?? false]),
    ) as Record<DealTag, boolean>,
  };
}

/** Rows with something in them; fully blank rows are ignored. */
function filledRows<Row extends Record<string, string>>(rows: Row[]) {
  return rows.filter((row) =>
    Object.values(row).some((value) => value.trim() !== ""),
  );
}

function sumAmounts(amounts: string[]) {
  return amounts.reduce((total, text) => {
    const value = toNumber(text);
    return Number.isFinite(value) && value > 0 ? total + value : total;
  }, 0);
}

/** Numbers for the live preview: valid sections only, totals from valid rows. */
export function toCalcInput(values: FormValues): CalcInput {
  const purchase = purchaseSchema.safeParse(values.purchase);
  const taxes = taxesSchema.safeParse(values.taxes);
  const revenue = revenueSchema.safeParse(values.revenue);

  return {
    purchase: purchase.success ? purchase.data : null,
    optimizationTotal: sumAmounts(
      values.optimizationItems.map((row) => row.amount),
    ),
    monthlyOpex: sumAmounts(
      values.operatingExpenses.map((row) => row.monthlyAmount),
    ),
    taxes: taxes.success ? taxes.data : null,
    revenue: revenue.success ? revenue.data : null,
  };
}

export type PayloadSection =
  "purchase" | "optimizationItems" | "operatingExpenses" | "taxes" | "revenue";

/**
 * Form values → save/submit body. The API rejects a half-filled section, so
 * only sections that are complete and valid are sent; the rest are listed in
 * `skipped` and stay in the browser until they're fixed.
 */
export function toPayload(values: FormValues): {
  payload: UnderwritingPayload;
  skipped: PayloadSection[];
} {
  const payload: UnderwritingPayload = { tags: { ...values.tags } };
  const skipped: PayloadSection[] = [];

  const purchase = purchaseSchema.safeParse(values.purchase);
  const optimization = optimizationItemsSchema.safeParse(
    values.optimizationItems,
  );
  const expenses = operatingExpensesSchema.safeParse(values.operatingExpenses);
  const taxes = taxesSchema.safeParse(values.taxes);
  const revenue = revenueSchema.safeParse(values.revenue);

  if (purchase.success) {
    payload.purchase_details = {
      purchase_price: String(purchase.data.price),
      down_payment_pct: percentToFractionText(purchase.data.downPaymentPct),
      interest_rate: percentToFractionText(purchase.data.interestRatePct),
      mortgage_years: purchase.data.termYears,
      closing_costs_pct: percentToFractionText(purchase.data.closingCostsPct),
    };
  } else {
    skipped.push("purchase");
  }

  if (optimization.success) {
    payload.optimization_items = filledRows(optimization.data).map((row) => ({
      category: row.category.trim(),
      total_price: String(toNumber(row.amount)),
    }));
  } else {
    skipped.push("optimizationItems");
  }

  if (expenses.success) {
    payload.operating_expenses = filledRows(expenses.data).map((row) => ({
      expense_name: row.name.trim(),
      monthly_amount: String(toNumber(row.monthlyAmount)),
    }));
  } else {
    skipped.push("operatingExpenses");
  }

  if (taxes.success) {
    payload.taxes = {
      land_assumptions_pct: percentToFractionText(taxes.data.landPct),
      sla_multiplier_pct: percentToFractionText(taxes.data.slaPct),
      bonus_amount_pct: percentToFractionText(taxes.data.bonusPct),
      tax_rate_pct: percentToFractionText(taxes.data.taxRatePct),
    };
  } else {
    skipped.push("taxes");
  }

  if (revenue.success) {
    payload.forecasted_revenue = {
      co_hosting_fee_pct: percentToFractionText(revenue.data.coHostingFeePct),
      annual_re_appreciation_pct: percentToFractionText(
        revenue.data.appreciationPct,
      ),
      scenarios: {
        low: { forecasted_revenue: String(revenue.data.low) },
        mid: { forecasted_revenue: String(revenue.data.mid) },
        high: { forecasted_revenue: String(revenue.data.high) },
      },
    };
  } else {
    skipped.push("revenue");
  }

  // The API refuses to calculate with $0 out of pocket (Cash-on-Cash would
  // divide by zero), so hold back the sections that feed it until it's fixed.
  if (purchase.success && optimization.success) {
    const optimizationTotal = sumAmounts(
      optimization.data.map((row) => row.amount),
    );
    if (
      calculateFinancing(purchase.data, optimizationTotal).totalOutOfPocket <= 0
    ) {
      delete payload.purchase_details;
      delete payload.optimization_items;
      skipped.push("purchase", "optimizationItems");
    }
  }

  return { payload, skipped };
}
