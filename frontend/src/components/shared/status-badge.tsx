import type { ComponentProps } from "react";
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TrainingStatus } from "@/lib/domain";

const STATUS_STYLES = {
  not_started: { label: "Not started", variant: "outline", Icon: CircleIcon },
  in_progress: {
    label: "In progress",
    variant: "secondary",
    Icon: CircleDashedIcon,
  },
  submitted: { label: "Submitted", variant: "default", Icon: CircleCheckIcon },
} satisfies Record<
  TrainingStatus,
  {
    label: string;
    variant: ComponentProps<typeof Badge>["variant"];
    Icon: LucideIcon;
  }
>;

export function StatusBadge({ status }: { status: TrainingStatus }) {
  const { label, variant, Icon } = STATUS_STYLES[status];

  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  );
}
