import { describe, expect, it } from "vitest";

import type { Underwriting } from "@/lib/api/schemas";
import { DEAL_TAGS } from "@/lib/domain";

import {
  fractionToPercentText,
  percentToFractionText,
  toCalcInput,
  toFormValues,
  toPayload,
} from "./mappers";
import { formSchema, TAX_DEFAULTS, type FormValues } from "./schema";

const noTags = Object.fromEntries(
  DEAL_TAGS.map((tag) => [tag, null]),
) as Record<(typeof DEAL_TAGS)[number], boolean | null>;

/** A brand-new draft: only the listing price is known. */
const newDraft: Underwriting = {
  id: 7,
  zpid: "41234567",
  market_id: 1,
  is_reference: false,
  deal_status: "analyst_started",
  deal_submitted: null,
  property_address: "1240 Ski View Dr, Gatlinburg, TN 37738",
  purchase_price: 675_000,
  total_oop: null,
  prr: null,
  low_gross_revenue: null,
  mid_gross_revenue: null,
  high_gross_revenue: null,
  l_cash_on_cash: null,
  m_cash_on_cash: null,
  h_cash_on_cash: null,
  optimization_total: null,
  operating_expense_total: null,
  ...noTags,
  updated_at: null,
  detail: { purchase_details: null, forecasted_revenue: null },
  taxes: null,
  optimization_items: [],
  operating_expenses: [],
};

/** A saved draft, shaped like the API returns it (fractions, numbers). */
const savedDraft: Underwriting = {
  ...newDraft,
  purchase_price: 660_000,
  turnkey: true,
  detail: {
    purchase_details: {
      purchase_price: 660_000,
      down_payment_pct: 0.2,
      interest_rate: 0.0699,
      mortgage_years: 30,
      closing_costs_pct: 0.03,
    },
    forecasted_revenue: {
      co_hosting_fee_pct: 0.1,
      annual_re_appreciation_pct: 0.03,
      scenarios: {
        low: { forecasted_revenue: 105_000 },
        mid: { forecasted_revenue: 125_000 },
        high: { forecasted_revenue: 142_000 },
      },
    },
  },
  taxes: {
    land_assumptions_pct: 0.2,
    sla_multiplier_pct: 0.25,
    bonus_amount_pct: 0.6,
    tax_rate_pct: 0.37,
    tax_savings: 32_967,
  },
  optimization_items: [{ id: 1, category: "Hot tub", total_price: 12_000 }],
  operating_expenses: [
    { id: 1, expense_name: "Utilities", monthly_amount: 450 },
  ],
};

describe("percent conversions", () => {
  it("hides float noise when turning fractions into whole percents", () => {
    expect(fractionToPercentText(0.07)).toBe("7"); // 0.07 * 100 = 7.000000000000001
    expect(fractionToPercentText(0.0699)).toBe("6.99");
    expect(fractionToPercentText(0.2)).toBe("20");
    expect(fractionToPercentText(null)).toBe("");
  });

  it("sends clean fraction strings to the API", () => {
    expect(percentToFractionText(7)).toBe("0.07");
    expect(percentToFractionText(6.99)).toBe("0.0699");
    expect(percentToFractionText(37)).toBe("0.37");
    expect(percentToFractionText(0)).toBe("0");
  });
});

describe("toFormValues", () => {
  it("prefills a new draft with the listing price and training defaults", () => {
    const values = toFormValues(newDraft);

    expect(values.purchase).toEqual({
      price: "675000",
      downPaymentPct: "",
      interestRatePct: "",
      termYears: "",
      closingCostsPct: "",
    });
    expect(values.taxes).toEqual(TAX_DEFAULTS);
    expect(values.revenue.coHostingFeePct).toBe("0");
    expect(values.optimizationItems).toEqual([]);
    expect(Object.values(values.tags).every((tag) => tag === false)).toBe(true);
  });

  it("turns a saved draft back into whole-number percents", () => {
    const values = toFormValues(savedDraft);

    expect(values.purchase.interestRatePct).toBe("6.99");
    expect(values.revenue).toMatchObject({
      mid: "125000",
      coHostingFeePct: "10",
    });
    expect(values.optimizationItems).toEqual([
      { category: "Hot tub", amount: "12000" },
    ]);
    expect(values.tags.turnkey).toBe(true);
  });
});

describe("toPayload", () => {
  it("round-trips a saved draft to the same API values", () => {
    const { payload, skipped } = toPayload(toFormValues(savedDraft));

    expect(skipped).toEqual([]);
    expect(payload.purchase_details).toEqual({
      purchase_price: "660000",
      down_payment_pct: "0.2",
      interest_rate: "0.0699",
      mortgage_years: 30,
      closing_costs_pct: "0.03",
    });
    expect(payload.forecasted_revenue?.co_hosting_fee_pct).toBe("0.1");
    expect(payload.taxes?.tax_rate_pct).toBe("0.37");
    expect(payload.optimization_items).toEqual([
      { category: "Hot tub", total_price: "12000" },
    ]);
    expect(payload.tags?.turnkey).toBe(true);
  });

  it("holds back incomplete sections instead of sending them half-filled", () => {
    const { payload, skipped } = toPayload(toFormValues(newDraft));

    expect(skipped).toEqual(["purchase", "revenue"]);
    expect(payload.purchase_details).toBeUndefined();
    expect(payload.forecasted_revenue).toBeUndefined();
    expect(payload.taxes).toBeDefined(); // the defaults are complete
  });

  it("ignores blank rows but holds back a half-filled row", () => {
    const values = toFormValues(savedDraft);
    values.operatingExpenses.push({ name: "", monthlyAmount: "" });
    expect(toPayload(values).payload.operating_expenses).toHaveLength(1);

    values.operatingExpenses.push({ name: "Internet", monthlyAmount: "" });
    const { payload, skipped } = toPayload(values);
    expect(skipped).toContain("operatingExpenses");
    expect(payload.operating_expenses).toBeUndefined();
  });

  it("holds back purchase and setup costs while out of pocket is $0", () => {
    const values = toFormValues(savedDraft);
    values.purchase.downPaymentPct = "0";
    values.purchase.closingCostsPct = "0";
    values.optimizationItems = [];

    const { payload, skipped } = toPayload(values);
    expect(skipped).toEqual(
      expect.arrayContaining(["purchase", "optimizationItems"]),
    );
    expect(payload.purchase_details).toBeUndefined();
    expect(payload.optimization_items).toBeUndefined();
  });
});

describe("toCalcInput", () => {
  it("totals valid rows and skips sections that don't parse yet", () => {
    const values: FormValues = toFormValues(savedDraft);
    values.operatingExpenses.push({ name: "Internet", monthlyAmount: "90" });
    values.revenue.mid = "";

    const input = toCalcInput(values);
    expect(input.monthlyOpex).toBe(540);
    expect(input.optimizationTotal).toBe(12_000);
    expect(input.revenue).toBeNull();
    expect(input.purchase?.interestRatePct).toBe(6.99);
  });
});

describe("formSchema", () => {
  function issuesFor(values: FormValues) {
    const result = formSchema.safeParse(values);
    return result.success
      ? []
      : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  }

  it("accepts a complete draft", () => {
    expect(issuesFor(toFormValues(savedDraft))).toEqual([]);
  });

  it("explains out-of-range and missing values", () => {
    const values = toFormValues(savedDraft);
    values.purchase.downPaymentPct = "120";
    values.purchase.termYears = "";

    expect(issuesFor(values)).toEqual([
      "purchase.downPaymentPct: Down payment can't be more than 100%",
      "purchase.termYears: Loan term is required",
    ]);
  });

  it("requires Low ≤ Mid ≤ High", () => {
    const values = toFormValues(savedDraft);
    values.revenue.low = "130000";

    expect(issuesFor(values)).toEqual([
      "revenue.mid: Mid can't be lower than Low",
    ]);
  });
});
