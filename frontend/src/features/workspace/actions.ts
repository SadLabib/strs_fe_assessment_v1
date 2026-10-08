"use server";

import { z } from "zod";

import { getUnderwriting, saveUnderwriting } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { DEAL_TAGS, type DealTag } from "@/lib/domain";

import { toPayload, type PayloadSection } from "./mappers";
import { MAX_ROWS, MAX_TEXT } from "./schema";

export type SaveResult =
  | { ok: true; savedAt: string; skipped: PayloadSection[] }
  | { ok: false; error: string };

// Server Actions are public endpoints, so the body is untrusted. This checks
// its shape and size; toPayload() then validates each section properly.
const text = z.string().max(MAX_TEXT);
const numberText = z.string().max(20);
const formShape = z.object({
  purchase: z.object({
    price: numberText,
    downPaymentPct: numberText,
    interestRatePct: numberText,
    termYears: numberText,
    closingCostsPct: numberText,
  }),
  optimizationItems: z
    .array(z.object({ category: text, amount: numberText }))
    .max(MAX_ROWS),
  operatingExpenses: z
    .array(z.object({ name: text, monthlyAmount: numberText }))
    .max(MAX_ROWS),
  taxes: z.object({
    landPct: numberText,
    slaPct: numberText,
    bonusPct: numberText,
    taxRatePct: numberText,
  }),
  revenue: z.object({
    low: numberText,
    mid: numberText,
    high: numberText,
    coHostingFeePct: numberText,
    appreciationPct: numberText,
  }),
  tags: z.object(
    Object.fromEntries(DEAL_TAGS.map((tag) => [tag, z.boolean()])) as Record<
      DealTag,
      z.ZodBoolean
    >,
  ),
});

/** Saves the complete, valid sections of a trainee's draft. */
export async function saveDraft(
  underwritingId: number,
  values: unknown,
): Promise<SaveResult> {
  if (!Number.isInteger(underwritingId) || underwritingId <= 0) {
    return { ok: false, error: "This draft doesn't exist." };
  }
  const parsed = formShape.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some values couldn't be read. Reload the page and try again.",
    };
  }

  try {
    // getUnderwriting also refuses references (the answer key).
    const draft = await getUnderwriting(underwritingId);
    if (draft.deal_submitted) {
      return {
        ok: false,
        error: "This attempt was already submitted, so it can't be changed.",
      };
    }

    const { payload, skipped } = toPayload(parsed.data);
    await saveUnderwriting(underwritingId, payload);
    return { ok: true, savedAt: new Date().toISOString(), skipped };
  } catch (error) {
    console.error("saveDraft failed", { underwritingId, error });
    return { ok: false, error: saveErrorMessage(error) };
  }
}

function saveErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.kind === "not_found") {
      return "This draft no longer exists. The training data may have been reset.";
    }
    if (error.kind === "forbidden") return "This underwriting can't be edited.";
    if (error.kind === "validation") {
      return "The server rejected some values. Check the highlighted fields.";
    }
  }
  return "Couldn't save. Check that the training API is running, then retry.";
}
