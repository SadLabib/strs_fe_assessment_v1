"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { saveDraft, type SaveResult } from "./actions";
import type { PayloadSection } from "./mappers";
import type { FormValues } from "./schema";

export type SaveStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "saving" }
  | { state: "saved"; at: Date; skipped: PayloadSection[] }
  | { state: "error"; message: string };

const DEBOUNCE_MS = 1_000;

/**
 * Saves the draft about a second after the trainee stops typing.
 *
 * Only one save runs at a time. Changes made while a save is in flight are
 * coalesced into a single follow-up save with the newest values, so slow
 * responses never pile up and an older snapshot can't overwrite a newer one.
 */
export function useAutosave(
  underwritingId: number,
  form: Pick<UseFormReturn<FormValues>, "watch" | "getValues">,
) {
  const [status, setStatus] = useState<SaveStatus>({ state: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const unsaved = useRef(false);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) {
      queued.current = true;
      return;
    }

    inFlight.current = true;
    // Keep going while changes arrived during the last save: each round
    // sends the newest values.
    do {
      queued.current = false;
      unsaved.current = false;
      setStatus({ state: "saving" });

      let result: SaveResult;
      try {
        result = await saveDraft(underwritingId, form.getValues());
      } catch {
        result = {
          ok: false,
          error:
            "Couldn't reach the server. Check your connection, then retry.",
        };
      }

      if (result.ok) {
        setStatus({
          state: "saved",
          at: new Date(result.savedAt),
          skipped: result.skipped,
        });
      } else {
        unsaved.current = true;
        setStatus({ state: "error", message: result.error });
      }
    } while (queued.current);
    inFlight.current = false;
  }, [form, underwritingId]);

  // Debounce: every change restarts the timer.
  useEffect(() => {
    const subscription = form.watch(() => {
      unsaved.current = true;
      setStatus((current) =>
        current.state === "pending" ? current : { state: "pending" },
      );
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer.current);
      // Leaving the workspace through an in-app link: save what's pending.
      if (unsaved.current) void save();
    };
  }, [form, save]);

  // Closing the tab or reloading with unsaved changes: ask first.
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (unsaved.current || inFlight.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { status, save };
}
