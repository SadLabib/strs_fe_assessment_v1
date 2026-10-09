import { describe, expect, it } from "vitest";

import { calculate, monthlyPayment, type CalcInput } from "./underwriting";

// Golden numbers come from the backend's own calculator: the seeded reference
// underwritings returned by GET /api/underwritings/{id}. The preview rounds
// like the API, so they must match exactly, not just closely.

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

    expect(result.financing?.downPayment).toBe(132_000);
    expect(result.financing?.loanAmount).toBe(528_000);
    expect(result.financing?.closingCosts).toBe(19_800);
    expect(result.financing?.totalOutOfPocket).toBe(217_800);
    expect(result.financing?.annualDebtService).toBe(42_111.02);
    expect(result.taxes?.improvementBasis).toBe(594_000);
    expect(result.taxes?.taxSavings).toBe(32_967);
    expect(result.prr).toBe(0.1894);
  });

  it("matches the API for every revenue scenario (Gatlinburg)", () => {
    const { scenarios } = calculate(gatlinburg);

    expect(scenarios?.low).toMatchObject({
      operatingExpenses: 21_312,
      netOperatingIncome: 83_688,
    });
    expect(scenarios?.low.freeCashFlow).toBe(41_576.98);
    expect(scenarios?.low.cashOnCash).toBe(0.1909);
    expect(scenarios?.mid.netOperatingIncome).toBe(102_800);
    expect(scenarios?.mid.freeCashFlow).toBe(60_688.98);
    expect(scenarios?.mid.cashOnCash).toBe(0.2786);
    expect(scenarios?.high.operatingExpenses).toBe(23_088);
    expect(scenarios?.high.freeCashFlow).toBe(76_800.98);
    expect(scenarios?.high.cashOnCash).toBe(0.3526);
  });

  it("applies the co-hosting fee to each scenario (Kissimmee, 10%)", () => {
    const result = calculate(kissimmee);

    expect(result.financing?.totalOutOfPocket).toBe(319_100);
    expect(result.taxes?.taxSavings).toBe(45_232.5);
    expect(result.scenarios?.low.coHostingFee).toBe(14_000);
    expect(result.scenarios?.mid.netOperatingIncome).toBe(105_900);
    expect(result.scenarios?.mid.freeCashFlow).toBe(50_390.02);
    expect(result.scenarios?.high.cashOnCash).toBe(0.209);
  });

  it("rounds like the API where the display would otherwise disagree", () => {
    // A trainee draft for Broken Bow, saved through the API. Unrounded, PRR is
    // 0.18148… (18.1%) and low Cash-on-Cash 0.21148… (21.1%); the API stores
    // 0.1815 and 0.2115, which read 18.2% and 21.2%.
    const result = calculate({
      purchase: {
        price: 540_000,
        downPaymentPct: 20,
        interestRatePct: 7,
        termYears: 30,
        closingCostsPct: 3,
      },
      optimizationTotal: 44_000,
      monthlyOpex: 1_210,
      taxes: STANDARD_TAXES,
      revenue: { low: 84_000, mid: 98_000, high: 112_000, coHostingFeePct: 0 },
    });

    expect(result.prr).toBe(0.1815);
    expect(result.financing?.totalOutOfPocket).toBe(168_200);
    expect(result.financing?.annualDebtService).toBe(34_489.28);
    expect(result.taxes?.taxSavings).toBe(26_418);
    expect(result.scenarios?.low.freeCashFlow).toBe(35_571.52);
    expect(result.scenarios?.low.cashOnCash).toBe(0.2115);
    expect(result.scenarios?.mid.cashOnCash).toBe(0.2913);
    expect(result.scenarios?.high.operatingExpenses).toBe(15_100.8);
    expect(result.scenarios?.high.cashOnCash).toBe(0.371);
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
    expect(onlyRevenue.scenarios?.mid.netOperatingIncome).toBe(102_800);
    expect(onlyRevenue.scenarios?.mid.freeCashFlow).toBeNull();

    const noRevenue = calculate({ ...gatlinburg, revenue: null });
    expect(noRevenue.scenarios).toBeNull();
    expect(noRevenue.financing?.totalOutOfPocket).toBe(217_800);
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
