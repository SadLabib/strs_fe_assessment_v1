import type { DashboardProperty } from "@/lib/api/schemas";
import { routes } from "@/lib/routes";

/** The one obvious next step for a training case, based on its status. */
export function caseAction(property: DashboardProperty) {
  if (
    property.status === "in_progress" &&
    property.active_underwriting_id != null
  ) {
    return {
      label: "Resume draft",
      href: routes.underwriting(property.active_underwriting_id),
    };
  }
  if (
    property.status === "submitted" &&
    property.latest_submission_id != null
  ) {
    return {
      label: "View results",
      href: routes.submission(property.latest_submission_id),
    };
  }
  return { label: "Start", href: routes.property(property.zpid) };
}

/** Resume an open draft first; otherwise the first case not started yet. */
export function nextCase(properties: DashboardProperty[]) {
  return (
    properties.find((property) => property.status === "in_progress") ??
    properties.find((property) => property.status === "not_started")
  );
}
