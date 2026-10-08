"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createUnderwriting, getDashboard } from "@/lib/api/endpoints";
import { routes } from "@/lib/routes";

export type StartState = { error: string } | null;

const zpidSchema = z.string().regex(/^\d{1,12}$/);

/**
 * Opens the workspace for a property. The API creates a new draft on every
 * POST, so an open draft is reused instead; with the button disabled while
 * pending, a double click can't create two drafts.
 */
export async function startUnderwriting(
  _previous: StartState,
  formData: FormData,
): Promise<StartState> {
  // Server Actions are public endpoints: never trust the form data.
  const zpid = zpidSchema.safeParse(formData.get("zpid"));
  if (!zpid.success) return { error: "That property doesn't exist." };

  let underwritingId: number;
  try {
    const { properties } = await getDashboard();
    const property = properties.find((row) => row.zpid === zpid.data);
    if (!property) return { error: "That property is no longer available." };

    underwritingId =
      property.active_underwriting_id ??
      (await createUnderwriting(property.zpid)).id;
  } catch (error) {
    console.error("startUnderwriting failed", error);
    return {
      error:
        "Couldn't start the underwriting. Check that the training API is running, then try again.",
    };
  }

  revalidatePath(routes.dashboard());
  // Outside the try: redirect() works by throwing.
  redirect(routes.underwriting(underwritingId));
}
