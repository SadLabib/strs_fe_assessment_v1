import "server-only";
import { cache } from "react";
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

// Reads are wrapped in React `cache` so a page and its `generateMetadata` share
// one request. Next's automatic fetch dedupe doesn't apply here because
// `apiFetch` passes a timeout `signal`.

export const getDashboard = cache(() => {
  return apiFetch("/api/dashboard", dashboardSchema);
});

export const getProperty = cache((zpid: string) => {
  return apiFetch(
    `/api/properties/${encodeURIComponent(zpid)}`,
    propertySchema,
  );
});

export const getMarket = cache((id: number) => {
  return apiFetch(`/api/markets/${id}`, marketSchema);
});

/**
 * Trainee underwritings only. The API also serves the analyst's reference
 * (the answer key) by id, so references are treated as if they don't exist.
 */
export const getUnderwriting = cache(async (id: number) => {
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
});

export const listSubmissions = cache((zpid?: string) => {
  const query = zpid ? `?zpid=${encodeURIComponent(zpid)}` : "";
  return apiFetch(`/api/submissions${query}`, z.array(submissionSchema));
});

export const getSubmission = cache((id: number) => {
  return apiFetch(`/api/submissions/${id}`, submissionSchema);
});

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
