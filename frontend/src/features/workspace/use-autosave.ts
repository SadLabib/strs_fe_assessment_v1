"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { saveDraft, type SaveResult } from "./actions";
import type { PayloadSection } from "./mappers";
import type { FormValues } from "./schema";
import type { ServerSummary } from "./server-summary";

export type SaveStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "saving" }
  | { state: "saved"; at: Date }
  | { state: "error"; message: string };

/** What the server confirmed on the last successful save. */
export type Confirmed = {
  at: Date;
  summary: ServerSummary | null;
  skipped: PayloadSection[];
};

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
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
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
        const at = new Date(result.savedAt);
        setStatus({ state: "saved", at });
        setConfirmed({
          at,
          summary: result.confirmed,
          skipped: result.skipped,
        });
      } else {
        unsaved.current = true;
        setStatus({ state: "error", message: result.error });
      }
    } while (queued.current);
    inFlight.current = false;
  }, [form, underwritingId]);

  /** Stop pending saves, e.g. right before submitting (submit sends everything). */
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    queued.current = false;
    unsaved.current = false;
  }, []);

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

  return { status, confirmed, save, cancel };
}
