import { describe, expect, it } from "vitest";

import { calculate, monthlyPayment, type CalcInput } from "./underwriting";

// Golden numbers come from the backend's own calculator: the seeded reference
// underwritings returned by GET /api/underwritings/{id}.

const STANDARD_TAXES = {
  landPct: 20,
  slaPct: 25,
  bonusPct: 60,
  taxRatePct: 37,
};

const gatlinburg: CalcInput = {
  purchase: {
    price: 660_000,
    downPaymentPct: 20,
    interestRatePct: 6.99,
    termYears: 30,
    closingCostsPct: 3,
  },
  optimizationTotal: 66_000,
  monthlyOpex: 1_850,
  taxes: STANDARD_TAXES,
  revenue: { low: 105_000, mid: 125_000, high: 142_000, coHostingFeePct: 0 },
};

const kissimmee: CalcInput = {
  purchase: {
    price: 870_000,
    downPaymentPct: 20,
    interestRatePct: 6.99,
    termYears: 30,
    closingCostsPct: 3,
  },
  optimizationTotal: 119_000,
  monthlyOpex: 3_550,
  taxes: STANDARD_TAXES,
  revenue: { low: 140_000, mid: 165_000, high: 185_000, coHostingFeePct: 10 },
};

describe("calculate", () => {
  it("matches the API for purchase, financing and taxes (Gatlinburg)", () => {
    const result = calculate(gatlinburg);

    expect(result.financing?.downPayment).toBeCloseTo(132_000, 2);
    expect(result.financing?.loanAmount).toBeCloseTo(528_000, 2);
    expect(result.financing?.closingCosts).toBeCloseTo(19_800, 2);
    expect(result.financing?.totalOutOfPocket).toBeCloseTo(217_800, 2);
    expect(result.financing?.annualDebtService).toBeCloseTo(42_111.02, 2);
    expect(result.taxes?.improvementBasis).toBeCloseTo(594_000, 2);
    expect(result.taxes?.taxSavings).toBeCloseTo(32_967, 2);
    expect(result.prr).toBeCloseTo(0.1894, 4);
  });

  it("matches the API for every revenue scenario (Gatlinburg)", () => {
    const { scenarios } = calculate(gatlinburg);

    expect(scenarios?.low).toMatchObject({
      operatingExpenses: 21_312,
      netOperatingIncome: 83_688,
    });
    expect(scenarios?.low.freeCashFlow).toBeCloseTo(41_576.98, 2);
    expect(scenarios?.low.cashOnCash).toBeCloseTo(0.1909, 4);
    expect(scenarios?.mid.netOperatingIncome).toBeCloseTo(102_800, 2);
    expect(scenarios?.mid.freeCashFlow).toBeCloseTo(60_688.98, 2);
    expect(scenarios?.mid.cashOnCash).toBeCloseTo(0.2786, 4);
    expect(scenarios?.high.operatingExpenses).toBeCloseTo(23_088, 2);
    expect(scenarios?.high.freeCashFlow).toBeCloseTo(76_800.98, 2);
    expect(scenarios?.high.cashOnCash).toBeCloseTo(0.3526, 4);
  });

  it("applies the co-hosting fee to each scenario (Kissimmee, 10%)", () => {
    const result = calculate(kissimmee);

    expect(result.financing?.totalOutOfPocket).toBeCloseTo(319_100, 2);
    expect(result.taxes?.taxSavings).toBeCloseTo(45_232.5, 2);
    expect(result.scenarios?.low.coHostingFee).toBeCloseTo(14_000, 2);
    expect(result.scenarios?.mid.netOperatingIncome).toBeCloseTo(105_900, 2);
    expect(result.scenarios?.mid.freeCashFlow).toBeCloseTo(50_390.02, 2);
    expect(result.scenarios?.high.cashOnCash).toBeCloseTo(0.209, 4);
  });

  it("returns partial results while sections are missing", () => {
    const onlyRevenue = calculate({
      ...gatlinburg,
      purchase: null,
      taxes: null,
    });
    expect(onlyRevenue.financing).toBeNull();
    expect(onlyRevenue.taxes).toBeNull();
    expect(onlyRevenue.prr).toBeNull();
    expect(onlyRevenue.scenarios?.mid.netOperatingIncome).toBeCloseTo(
      102_800,
      2,
    );
    expect(onlyRevenue.scenarios?.mid.freeCashFlow).toBeNull();

    const noRevenue = calculate({ ...gatlinburg, revenue: null });
    expect(noRevenue.scenarios).toBeNull();
    expect(noRevenue.financing?.totalOutOfPocket).toBeCloseTo(217_800, 2);
  });

  it("has no cash-on-cash when nothing is paid out of pocket", () => {
    const result = calculate({
      ...gatlinburg,
      purchase: {
        ...gatlinburg.purchase!,
        downPaymentPct: 0,
        closingCostsPct: 0,
      },
      optimizationTotal: 0,
    });
    expect(result.financing?.totalOutOfPocket).toBe(0);
    expect(result.scenarios?.mid.cashOnCash).toBeNull();
  });
});

describe("monthlyPayment", () => {
  it("splits the loan evenly when the rate is 0%", () => {
    expect(monthlyPayment(360_000, 0, 30)).toBeCloseTo(1_000, 6);
  });

  it("is 0 when there is no loan (100% down)", () => {
    expect(monthlyPayment(0, 7, 30)).toBe(0);
  });
});
