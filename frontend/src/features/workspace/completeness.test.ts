import { describe, expect, it } from "vitest";

import { DEAL_TAGS } from "@/lib/domain";

import {
  combineStatuses,
  reviewIssues,
  reviewWarnings,
  sectionStatuses,
} from "./completeness";
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

describe("reviewIssues", () => {
  it("points each problem at its field, and tells blank from wrong", () => {
    const draft = values();
    draft.purchase.termYears = "";
    draft.purchase.interestRatePct = "120";
    draft.optimizationItems = [{ category: "Lighting", amount: "" }];

    expect(reviewIssues(draft)).toEqual([
      {
        section: "purchase",
        path: "purchase.interestRatePct",
        message: "Interest rate can't be more than 100%",
        blank: false,
      },
      {
        section: "purchase",
        path: "purchase.termYears",
        message: "Loan term is required",
        blank: true,
      },
      {
        section: "optimizationItems",
        path: "optimizationItems.0.amount",
        message: "Add an amount",
        blank: true,
      },
    ]);
  });

  it("is empty for a draft that can be submitted", () => {
    expect(reviewIssues(values())).toEqual([]);
  });
});

describe("reviewWarnings", () => {
  it("nudges about empty expense and setup lists without blocking", () => {
    expect(reviewWarnings(values())).toEqual([]);
    expect(
      reviewWarnings(values({ operatingExpenses: [], optimizationItems: [] })),
    ).toHaveLength(2);
  });
});
