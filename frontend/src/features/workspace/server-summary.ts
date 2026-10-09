import type { Underwriting } from "@/lib/api/schemas";
import { SCENARIOS, type Scenario } from "@/lib/domain";

export type ServerScenario = {
  revenue: number;
  netOperatingIncome: number | null;
  freeCashFlow: number | null;
  cashOnCash: number | null;
};

/** The numbers the API calculated when the draft was saved: the source of truth. */
export type ServerSummary = {
  totalOutOfPocket: number;
  taxSavings: number | null;
  prr: number | null;
  scenarios: Record<Scenario, ServerScenario>;
};

/** Null until purchase, revenue and taxes have all been saved (the API calculates nothing before that). */
export function toServerSummary(
  underwriting: Underwriting,
): ServerSummary | null {
  const scenarios = underwriting.detail?.forecasted_revenue?.scenarios;
  if (
    underwriting.total_oop == null ||
    scenarios?.mid.net_operating_income == null
  )
    return null;

  return {
    totalOutOfPocket: underwriting.total_oop,
    taxSavings: underwriting.taxes?.tax_savings ?? null,
    prr: underwriting.prr,
    scenarios: Object.fromEntries(
      SCENARIOS.map((name) => {
        const scenario = scenarios[name];
        return [
          name,
          {
            revenue: scenario.forecasted_revenue,
            netOperatingIncome: scenario.net_operating_income ?? null,
            freeCashFlow: scenario.annual_free_cash_flow ?? null,
            cashOnCash: scenario.cash_on_cash_pct ?? null,
          },
        ];
      }),
    ) as Record<Scenario, ServerScenario>,
  };
}
