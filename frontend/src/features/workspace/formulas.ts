import type { CalcResult, ScenarioResult } from "@/lib/calc/underwriting";
import { formatCurrency as $, formatPercent } from "@/lib/format";

// Each formula, plus the same formula filled in with the trainee's numbers
// ("how was this number reached?").

export const FORMULAS = {
  outOfPocket: "Down payment + Closing costs + Setup total",
  noi: "Revenue − Operating expenses − Co-hosting fee",
  freeCashFlow: "Net operating income − Annual debt service",
  cashOnCash: "Annual free cash flow ÷ Total out of pocket",
  taxSavings: "Year-one depreciation × Tax rate",
  prr: "Mid revenue ÷ Purchase price",
};

export function workedOutOfPocket({
  financing,
  optimizationTotal,
}: CalcResult) {
  if (!financing) return null;
  const { downPayment, closingCosts, totalOutOfPocket } = financing;
  return `${$(downPayment)} + ${$(closingCosts)} + ${$(optimizationTotal)} = ${$(totalOutOfPocket)}`;
}

export function workedNoi(scenario: ScenarioResult | undefined) {
  if (!scenario) return null;
  const { revenue, operatingExpenses, coHostingFee, netOperatingIncome } =
    scenario;
  return `Mid: ${$(revenue)} − ${$(operatingExpenses)} − ${$(coHostingFee)} = ${$(netOperatingIncome)}`;
}

export function workedFreeCashFlow({ financing, scenarios }: CalcResult) {
  const mid = scenarios?.mid;
  if (!financing || mid?.freeCashFlow == null) return null;
  return `Mid: ${$(mid.netOperatingIncome)} − ${$(financing.annualDebtService)} = ${$(mid.freeCashFlow)}`;
}

export function workedCashOnCash({ financing, scenarios }: CalcResult) {
  const mid = scenarios?.mid;
  if (!financing || mid?.freeCashFlow == null || mid.cashOnCash == null)
    return null;
  return `Mid: ${$(mid.freeCashFlow)} ÷ ${$(financing.totalOutOfPocket)} = ${formatPercent(mid.cashOnCash)}`;
}

export function workedTaxSavings({ taxes }: CalcResult, taxRatePct: string) {
  if (!taxes) return null;
  return `${$(taxes.yearOneDepreciation)} × ${taxRatePct}% = ${$(taxes.taxSavings)}`;
}

export function workedPrr({ prr, scenarios }: CalcResult, price: string) {
  if (prr == null || !scenarios) return null;
  return `${$(scenarios.mid.revenue)} ÷ ${$(Number(price))} = ${formatPercent(prr)}`;
}
