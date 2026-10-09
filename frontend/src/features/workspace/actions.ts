"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getUnderwriting,
  listSubmissions,
  saveUnderwriting,
  submitUnderwriting,
} from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { Underwriting } from "@/lib/api/schemas";
import { DEAL_TAGS, type DealTag } from "@/lib/domain";
import { routes } from "@/lib/routes";

import { reviewIssues } from "./completeness";
import { toPayload, type PayloadSection } from "./mappers";
import { MAX_ROWS, MAX_TEXT } from "./schema";
import { toServerSummary, type ServerSummary } from "./server-summary";

export type SaveResult =
  | {
      ok: true;
      savedAt: string;
      skipped: PayloadSection[];
      confirmed: ServerSummary | null;
    }
  | { ok: false; error: string };

export type SubmitResult = { ok: false; error: string };

// Server Actions are public endpoints, so the body is untrusted. This checks
// its shape and size; toPayload() and reviewIssues() then validate the content.
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

const isValidId = (id: number) => Number.isInteger(id) && id > 0;

/** Saves the complete, valid sections of a trainee's draft. */
export async function saveDraft(
  underwritingId: number,
  values: unknown,
): Promise<SaveResult> {
  if (!isValidId(underwritingId))
    return { ok: false, error: "This draft doesn't exist." };
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
    const saved = await saveUnderwriting(underwritingId, payload);
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      skipped,
      confirmed: toServerSummary(saved),
    };
  } catch (error) {
    console.error("saveDraft failed", { underwritingId, error });
    return { ok: false, error: apiErrorMessage(error, "save") };
  }
}

/**
 * Grades the draft and opens its results. Submitting is final, so everything
 * is re-checked here; the button being enabled proves nothing.
 */
export async function submitDraft(
  underwritingId: number,
  values: unknown,
): Promise<SubmitResult> {
  if (!isValidId(underwritingId))
    return { ok: false, error: "This draft doesn't exist." };
  const parsed = formShape.safeParse(values);
  if (!parsed.success || reviewIssues(parsed.data).length > 0) {
    return {
      ok: false,
      error:
        "Some sections are incomplete or invalid. Fix the items in the checklist, then submit.",
    };
  }

  let submissionId: number;
  let zpid: string | null;
  try {
    const draft = await getUnderwriting(underwritingId);
    zpid = draft.zpid;
    if (draft.deal_submitted) {
      // Already graded (a second click, or another tab): show those results
      // instead of grading the same attempt twice.
      submissionId = await findSubmissionId(draft);
    } else {
      const { payload } = toPayload(parsed.data);
      const result = await submitUnderwriting(underwritingId, payload);
      submissionId = result.submission.id;
    }
  } catch (error) {
    console.error("submitDraft failed", { underwritingId, error });
    return { ok: false, error: apiErrorMessage(error, "submit") };
  }

  revalidatePath(routes.dashboard());
  if (zpid) revalidatePath(routes.property(zpid));
  // Outside the try: redirect() works by throwing.
  redirect(routes.submission(submissionId));
}

async function findSubmissionId(draft: Underwriting) {
  const submissions = draft.zpid ? await listSubmissions(draft.zpid) : [];
  const submission = submissions.find((s) => s.underwriting_id === draft.id);
  if (!submission)
    throw new ApiError(
      "not_found",
      `No submission for underwriting ${draft.id}`,
    );
  return submission.id;
}

function apiErrorMessage(error: unknown, action: "save" | "submit") {
  if (error instanceof ApiError) {
    if (error.kind === "not_found") {
      return "This draft no longer exists. The training data may have been reset.";
    }
    if (error.kind === "forbidden") return "This underwriting can't be edited.";
    if (error.kind === "validation") {
      return "The server rejected some values. Check the highlighted fields.";
    }
  }
  return `Couldn't ${action}. Check that the training API is running, then retry.`;
}
