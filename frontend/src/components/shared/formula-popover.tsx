"use client";

import { InfoIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FormulaPopoverProps = {
  label: string;
  formula: string;
  /** The same formula with the trainee's own numbers, when they exist. */
  worked?: string | null;
};

/** "How was this number reached?": the formula, then the trainee's own numbers. */
export function FormulaPopover({
  label,
  formula,
  worked,
}: FormulaPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`How ${label} is calculated`}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <InfoIcon className="size-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 text-sm">
        <p className="font-medium">{label}</p>
        <p className="rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
          {formula}
        </p>
        {worked && (
          <p className="text-muted-foreground tabular-nums">{worked}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
