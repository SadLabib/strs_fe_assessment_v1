import type { FieldPath } from "react-hook-form";

import { toPayload } from "./mappers";
import {
  operatingExpensesSchema,
  optimizationItemsSchema,
  purchaseSchema,
  revenueSchema,
  taxesSchema,
  type FormValues,
} from "./schema";

export type SectionStatus = "complete" | "incomplete" | "invalid";

const SECTION_SCHEMAS = {
  purchase: purchaseSchema,
  optimizationItems: optimizationItemsSchema,
  operatingExpenses: operatingExpensesSchema,
  taxes: taxesSchema,
  revenue: revenueSchema,
};

export type Section = keyof typeof SECTION_SCHEMAS;

/** Labels and the tab each section lives on (for "jump to this field"). */
export const SECTIONS: Record<
  Section,
  { label: string; tab: "financials" | "analysis" }
> = {
  purchase: { label: "Purchase & financing", tab: "financials" },
  optimizationItems: { label: "Optimization list", tab: "financials" },
  operatingExpenses: { label: "Operating expenses", tab: "financials" },
  taxes: { label: "Taxes", tab: "financials" },
  revenue: { label: "Revenue forecast", tab: "analysis" },
};

export type ReviewIssue = {
  section: Section;
  path: FieldPath<FormValues>;
  message: string;
  /** Nothing entered yet, as opposed to something entered wrong. */
  blank: boolean;
};

function valueAt(source: unknown, path: PropertyKey[]): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      value != null && typeof value === "object"
        ? (value as Record<PropertyKey, unknown>)[key]
        : undefined,
    source,
  );
}

const isBlank = (value: unknown) =>
  typeof value === "string" && value.trim() === "";

/** Everything that blocks submission, in form order, each pointing at its field. */
export function reviewIssues(values: FormValues): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const section of Object.keys(SECTION_SCHEMAS) as Section[]) {
    const result = SECTION_SCHEMAS[section].safeParse(values[section]);
    if (result.success) continue;
    for (const issue of result.error.issues) {
      issues.push({
        section,
        path: [section, ...issue.path].join(".") as FieldPath<FormValues>,
        message: issue.message,
        blank: isBlank(valueAt(values[section], issue.path)),
      });
    }
  }

  // Valid on its own, but the API can't calculate with $0 out of pocket.
  if (
    purchaseSchema.safeParse(values.purchase).success &&
    toPayload(values).skipped.includes("purchase")
  ) {
    issues.push({
      section: "purchase",
      path: "purchase.downPaymentPct",
      message: "Total out of pocket must be more than $0",
      blank: false,
    });
  }

  return issues;
}

/**
 * - complete: no issues (and can be saved)
 * - incomplete: only blank fields are missing
 * - invalid: something that was entered is wrong
 */
export function sectionStatuses(
  values: FormValues,
): Record<Section, SectionStatus> {
  const issues = reviewIssues(values);
  return Object.fromEntries(
    (Object.keys(SECTION_SCHEMAS) as Section[]).map((section) => {
      const own = issues.filter((issue) => issue.section === section);
      const status: SectionStatus =
        own.length === 0
          ? "complete"
          : own.every((issue) => issue.blank)
            ? "incomplete"
            : "invalid";
      return [section, status];
    }),
  ) as Record<Section, SectionStatus>;
}

/** The worst status wins: invalid > incomplete > complete. */
export function combineStatuses(statuses: SectionStatus[]): SectionStatus {
  if (statuses.includes("invalid")) return "invalid";
  if (statuses.includes("incomplete")) return "incomplete";
  return "complete";
}

const hasRows = (rows: Record<string, string>[]) =>
  rows.some((row) => Object.values(row).some((value) => value.trim() !== ""));

/** Worth a second look before submitting, but not blocking. */
export function reviewWarnings(values: FormValues): string[] {
  const warnings: string[] = [];
  if (!hasRows(values.operatingExpenses)) {
    warnings.push(
      "No operating expenses added. Most deals have utilities, insurance and property tax.",
    );
  }
  if (!hasRows(values.optimizationItems)) {
    warnings.push(
      "No setup costs added. Furniture and amenities usually add to the cash needed.",
    );
  }
  return warnings;
}
