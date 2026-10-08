import { SCENARIOS, type Scenario } from "@/lib/domain";

// The formulas from the assessment's "Underwriting Calculations" tab, used for
// the live preview while the trainee types. Percentages are whole numbers
// (20 = 20%), exactly as the formulas are written. The API recalculates
// everything on save, and the server's numbers are the source of truth.

export type PurchaseInput = {
  price: number;
  downPaymentPct: number;
  interestRatePct: number;
  termYears: number;
  closingCostsPct: number;
};

export type TaxInput = {
  landPct: number;
  slaPct: number;
  bonusPct: number;
  taxRatePct: number;
};

export type RevenueInput = Record<Scenario, number> & {
  coHostingFeePct: number;
};

export type CalcInput = {
  purchase: PurchaseInput | null;
  optimizationTotal: number;
  monthlyOpex: number;
  taxes: TaxInput | null;
  revenue: RevenueInput | null;
};

export type Financing = {
  downPayment: number;
  loanAmount: number;
  closingCosts: number;
  monthlyPayment: number;
  annualDebtService: number;
  totalOutOfPocket: number;
};

export type TaxResult = {
  improvementBasis: number;
  shortLifeAssets: number;
  yearOneDepreciation: number;
  taxSavings: number;
};

export type ScenarioResult = {
  revenue: number;
  operatingExpenses: number;
  coHostingFee: number;
  netOperatingIncome: number;
  /** Needs purchase & financing. */
  freeCashFlow: number | null;
  /** A fraction (0.2786 = 27.86%), like the API. Null when out of pocket isn't positive. */
  cashOnCash: number | null;
};

export type CalcResult = {
  optimizationTotal: number;
  monthlyOpex: number;
  financing: Financing | null;
  taxes: TaxResult | null;
  scenarios: Record<Scenario, ScenarioResult> | null;
  /** Mid revenue ÷ purchase price, as a fraction. */
  prr: number | null;
};

/** Low and High nudge operating expenses slightly. */
export const OPEX_MULTIPLIERS: Record<Scenario, number> = {
  low: 0.96,
  mid: 1,
  high: 1.04,
};

/** Standard amortizing loan payment. */
export function monthlyPayment(
  loanAmount: number,
  interestRatePct: number,
  termYears: number,
) {
  if (loanAmount <= 0) return 0;
  const payments = termYears * 12;
  const rate = interestRatePct / 100 / 12;
  if (rate === 0) return loanAmount / payments;
  const growth = (1 + rate) ** payments;
  return (loanAmount * rate * growth) / (growth - 1);
}

export function calculateFinancing(
  purchase: PurchaseInput,
  optimizationTotal: number,
): Financing {
  const downPayment = purchase.price * (purchase.downPaymentPct / 100);
  const loanAmount = purchase.price * (1 - purchase.downPaymentPct / 100);
  const closingCosts = purchase.price * (purchase.closingCostsPct / 100);
  const payment = monthlyPayment(
    loanAmount,
    purchase.interestRatePct,
    purchase.termYears,
  );

  return {
    downPayment,
    loanAmount,
    closingCosts,
    monthlyPayment: payment,
    annualDebtService: payment * 12,
    totalOutOfPocket: downPayment + closingCosts + optimizationTotal,
  };
}

/** Cost-segregation chain: each step feeds the next. */
export function calculateTaxes(
  purchasePrice: number,
  taxes: TaxInput,
  optimizationTotal: number,
): TaxResult {
  const improvementBasis =
    purchasePrice * (1 - taxes.landPct / 100) + optimizationTotal;
  const shortLifeAssets = improvementBasis * (taxes.slaPct / 100);
  const yearOneDepreciation = shortLifeAssets * (taxes.bonusPct / 100);

  return {
    improvementBasis,
    shortLifeAssets,
    yearOneDepreciation,
    taxSavings: yearOneDepreciation * (taxes.taxRatePct / 100),
  };
}

function calculateScenario(
  scenario: Scenario,
  revenue: RevenueInput,
  monthlyOpex: number,
  financing: Financing | null,
): ScenarioResult {
  const forecast = revenue[scenario];
  const operatingExpenses = monthlyOpex * 12 * OPEX_MULTIPLIERS[scenario];
  const coHostingFee = forecast * (revenue.coHostingFeePct / 100);
  const netOperatingIncome = forecast - operatingExpenses - coHostingFee;
  const freeCashFlow = financing
    ? netOperatingIncome - financing.annualDebtService
    : null;
  const cashOnCash =
    financing && freeCashFlow != null && financing.totalOutOfPocket > 0
      ? freeCashFlow / financing.totalOutOfPocket
      : null;

  return {
    revenue: forecast,
    operatingExpenses,
    coHostingFee,
    netOperatingIncome,
    freeCashFlow,
    cashOnCash,
  };
}

/** Everything that can be worked out from the inputs so far. */
export function calculate(input: CalcInput): CalcResult {
  const financing = input.purchase
    ? calculateFinancing(input.purchase, input.optimizationTotal)
    : null;
  const taxes =
    input.purchase && input.taxes
      ? calculateTaxes(
          input.purchase.price,
          input.taxes,
          input.optimizationTotal,
        )
      : null;
  const { revenue } = input;
  const scenarios = revenue
    ? (Object.fromEntries(
        SCENARIOS.map((name) => [
          name,
          calculateScenario(name, revenue, input.monthlyOpex, financing),
        ]),
      ) as Record<Scenario, ScenarioResult>)
    : null;

  return {
    optimizationTotal: input.optimizationTotal,
    monthlyOpex: input.monthlyOpex,
    financing,
    taxes,
    scenarios,
    prr: input.purchase && revenue ? revenue.mid / input.purchase.price : null,
  };
}
