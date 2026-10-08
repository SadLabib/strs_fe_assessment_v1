import { describe, expect, it } from "vitest";

import { DEAL_TAGS } from "@/lib/domain";

import { combineStatuses, sectionStatuses } from "./completeness";
import { TAX_DEFAULTS, type FormValues } from "./schema";

function values(overrides: Partial<FormValues> = {}): FormValues {
  return {
    purchase: {
      price: "660000",
      downPaymentPct: "20",
      interestRatePct: "6.99",
      termYears: "30",
      closingCostsPct: "3",
    },
    optimizationItems: [{ category: "Hot tub", amount: "12000" }],
    operatingExpenses: [{ name: "Utilities", monthlyAmount: "450" }],
    taxes: { ...TAX_DEFAULTS },
    revenue: {
      low: "105000",
      mid: "125000",
      high: "142000",
      coHostingFeePct: "0",
      appreciationPct: "3",
    },
    tags: Object.fromEntries(
      DEAL_TAGS.map((tag) => [tag, false]),
    ) as FormValues["tags"],
    ...overrides,
  };
}

describe("sectionStatuses", () => {
  it("marks a filled-in draft complete", () => {
    expect(
      Object.values(sectionStatuses(values())).every((s) => s === "complete"),
    ).toBe(true);
  });

  it("calls a section incomplete when only blanks are missing", () => {
    const statuses = sectionStatuses(
      values({
        revenue: {
          low: "",
          mid: "",
          high: "",
          coHostingFeePct: "0",
          appreciationPct: "",
        },
      }),
    );
    expect(statuses.revenue).toBe("incomplete");
  });

  it("calls a section invalid when an entered value is wrong", () => {
    const wrongPercent = values();
    wrongPercent.purchase.downPaymentPct = "120";
    expect(sectionStatuses(wrongPercent).purchase).toBe("invalid");

    const wrongOrder = values();
    wrongOrder.revenue.low = "130000";
    expect(sectionStatuses(wrongOrder).revenue).toBe("invalid");
  });

  it("flags purchase when out of pocket would be $0", () => {
    const zero = values({ optimizationItems: [] });
    zero.purchase.downPaymentPct = "0";
    zero.purchase.closingCostsPct = "0";
    expect(sectionStatuses(zero).purchase).toBe("invalid");
  });

  it("treats an empty list as complete and a half-filled row as incomplete", () => {
    expect(
      sectionStatuses(values({ operatingExpenses: [] })).operatingExpenses,
    ).toBe("complete");
    expect(
      sectionStatuses(
        values({
          operatingExpenses: [{ name: "Internet", monthlyAmount: "" }],
        }),
      ).operatingExpenses,
    ).toBe("incomplete");
  });
});

describe("combineStatuses", () => {
  it("lets the worst status win", () => {
    expect(combineStatuses(["complete", "incomplete"])).toBe("incomplete");
    expect(combineStatuses(["incomplete", "invalid", "complete"])).toBe(
      "invalid",
    );
    expect(combineStatuses(["complete", "complete"])).toBe("complete");
  });
});
