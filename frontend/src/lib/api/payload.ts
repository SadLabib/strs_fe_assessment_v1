import type { DealTag, Scenario } from "@/lib/domain";

/** Decimals are sent as strings so 0.07 never goes over the wire as 0.07000000000000001. */
type DecimalString = string;

/**
 * Body for saving or submitting an underwriting. Every section is optional,
 * but a section that is sent must be complete: the API rejects half-filled ones.
 * Percentages are fractions (0.2 = 20%).
 */
export type UnderwritingPayload = {
  purchase_details?: {
    purchase_price: DecimalString;
    down_payment_pct: DecimalString;
    interest_rate: DecimalString;
    mortgage_years: number;
    closing_costs_pct: DecimalString;
  };
  forecasted_revenue?: {
    co_hosting_fee_pct: DecimalString;
    annual_re_appreciation_pct: DecimalString;
    scenarios: Record<Scenario, { forecasted_revenue: DecimalString }>;
  };
  taxes?: {
    land_assumptions_pct: DecimalString;
    sla_multiplier_pct: DecimalString;
    bonus_amount_pct: DecimalString;
    tax_rate_pct: DecimalString;
  };
  optimization_items?: { category: string; total_price: DecimalString }[];
  operating_expenses?: {
    expense_name: string;
    monthly_amount: DecimalString;
  }[];
  tags?: Partial<Record<DealTag, boolean>>;
};
