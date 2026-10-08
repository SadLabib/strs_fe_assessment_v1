import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { SectionStatus } from "./completeness";

const STATUS = {
  complete: {
    Icon: CircleCheckIcon,
    className: "text-success",
    label: "complete",
  },
  incomplete: {
    Icon: CircleDashedIcon,
    className: "text-muted-foreground",
    label: "incomplete",
  },
  invalid: {
    Icon: CircleAlertIcon,
    className: "text-danger",
    label: "needs attention",
  },
} satisfies Record<
  SectionStatus,
  { Icon: typeof CircleCheckIcon; className: string; label: string }
>;

export function statusLabel(status: SectionStatus) {
  return STATUS[status].label;
}

/** ✓ / ○ / ! with the status spelled out for screen readers. */
export function SectionStatusIcon({
  status,
  className,
  ...props
}: { status: SectionStatus; className?: string } & Record<
  `data-${string}`,
  string
>) {
  const { Icon, className: color, label } = STATUS[status];
  return (
    <>
      <Icon
        {...props}
        className={cn("size-4 shrink-0", color, className)}
        aria-hidden
      />
      <span className="sr-only">({label})</span>
    </>
  );
}
