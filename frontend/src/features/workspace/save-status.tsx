"use client";

import {
  CircleCheckIcon,
  CircleDotIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SaveStatus } from "./use-autosave";

// Shown only in the browser after a save, so the viewer's local time is fine
// here (no server render to mismatch).
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** Announced politely to screen readers as it changes. */
export function SaveStatusIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  return (
    <div role="status" className="flex min-h-8 items-center gap-2 text-sm">
      {status.state === "idle" && (
        <span className="text-muted-foreground">No changes yet</span>
      )}
      {status.state === "pending" && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CircleDotIcon className="size-4" aria-hidden />
          Unsaved changes
        </span>
      )}
      {status.state === "saving" && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Saving…
        </span>
      )}
      {status.state === "saved" && (
        <span className="inline-flex items-center gap-1.5 text-success">
          <CircleCheckIcon className="size-4" aria-hidden />
          Saved {timeFormat.format(status.at)}
        </span>
      )}
      {status.state === "error" && (
        <>
          <span className="inline-flex items-center gap-1.5 text-danger">
            <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
            {status.message}
          </span>
          <Button type="button" variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
