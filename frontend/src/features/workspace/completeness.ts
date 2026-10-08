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

/**
 * - complete: passes its schema (and can be saved)
 * - incomplete: only blank fields are missing
 * - invalid: something that was entered is wrong
 */
export function sectionStatuses(
  values: FormValues,
): Record<Section, SectionStatus> {
  const statuses = {} as Record<Section, SectionStatus>;

  for (const section of Object.keys(SECTION_SCHEMAS) as Section[]) {
    const result = SECTION_SCHEMAS[section].safeParse(values[section]);
    if (result.success) {
      statuses[section] = "complete";
    } else {
      const onlyBlanks = result.error.issues.every((issue) =>
        isBlank(valueAt(values[section], issue.path)),
      );
      statuses[section] = onlyBlanks ? "incomplete" : "invalid";
    }
  }

  // Valid on its own, but held back because out of pocket would be $0.
  if (
    statuses.purchase === "complete" &&
    toPayload(values).skipped.includes("purchase")
  ) {
    statuses.purchase = "invalid";
  }

  return statuses;
}

/** The worst status wins: invalid > incomplete > complete. */
export function combineStatuses(statuses: SectionStatus[]): SectionStatus {
  if (statuses.includes("invalid")) return "invalid";
  if (statuses.includes("incomplete")) return "incomplete";
  return "complete";
}
