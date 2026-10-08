"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { startUnderwriting } from "./actions";

type StartButtonProps = {
  zpid: string;
  label: string;
};

export function StartButton({ zpid, label }: StartButtonProps) {
  const [state, formAction, isPending] = useActionState(
    startUnderwriting,
    null,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col items-start gap-2 sm:items-end"
    >
      <input type="hidden" name="zpid" value={zpid} />
      <Button type="submit" variant="cta" size="lg" disabled={isPending}>
        {isPending && (
          <Loader2Icon
            className="animate-spin"
            data-icon="inline-start"
            aria-hidden
          />
        )}
        {isPending ? "Starting…" : label}
      </Button>
      {state?.error && (
        <p
          role="alert"
          className="max-w-xs text-sm text-destructive sm:text-right"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
