import "server-only";
import { z } from "zod";

import { apiFetch } from "./client";
import { ApiError } from "./errors";
import type { UnderwritingPayload } from "./payload";
import {
  dashboardSchema,
  marketSchema,
  propertySchema,
  submissionSchema,
  submitResultSchema,
  underwritingSchema,
} from "./schemas";

export function getDashboard() {
  return apiFetch("/api/dashboard", dashboardSchema);
}

export function getProperty(zpid: string) {
  return apiFetch(
    `/api/properties/${encodeURIComponent(zpid)}`,
    propertySchema,
  );
}

export function getMarket(id: number) {
  return apiFetch(`/api/markets/${id}`, marketSchema);
}

/**
 * Trainee underwritings only. The API also serves the analyst's reference
 * (the answer key) by id, so references are treated as if they don't exist.
 */
export async function getUnderwriting(id: number) {
  const underwriting = await apiFetch(
    `/api/underwritings/${id}`,
    underwritingSchema,
  );
  if (underwriting.is_reference) {
    throw new ApiError(
      "not_found",
      `Underwriting ${id} is a reference underwriting`,
    );
  }
  return underwriting;
}

export function createUnderwriting(zpid: string) {
  return apiFetch("/api/underwritings", underwritingSchema, {
    method: "POST",
    body: { zpid },
  });
}

export function saveUnderwriting(id: number, payload: UnderwritingPayload) {
  return apiFetch(`/api/underwritings/${id}`, underwritingSchema, {
    method: "PUT",
    body: payload,
  });
}

export function submitUnderwriting(id: number, payload: UnderwritingPayload) {
  return apiFetch(`/api/underwritings/${id}/submit`, submitResultSchema, {
    method: "POST",
    body: payload,
  });
}

export function listSubmissions(zpid?: string) {
  const query = zpid ? `?zpid=${encodeURIComponent(zpid)}` : "";
  return apiFetch(`/api/submissions${query}`, z.array(submissionSchema));
}

export function getSubmission(id: number) {
  return apiFetch(`/api/submissions/${id}`, submissionSchema);
}
