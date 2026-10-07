import type { ComponentProps } from "react";
import {
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Rating } from "@/lib/domain";

const RATING_STYLES = {
  best: { label: "Best", variant: "success", Icon: CircleCheckIcon },
  medium: { label: "Medium", variant: "warning", Icon: CircleMinusIcon },
  low: { label: "Low", variant: "danger", Icon: CircleXIcon },
} satisfies Record<
  Rating,
  {
    label: string;
    variant: ComponentProps<typeof Badge>["variant"];
    Icon: LucideIcon;
  }
>;

type RatingBadgeProps = {
  rating: Rating;
  accuracy?: number;
};

export function RatingBadge({ rating, accuracy }: RatingBadgeProps) {
  const { label, variant, Icon } = RATING_STYLES[rating];

  return (
    <Badge variant={variant} className="tabular-nums">
      <Icon data-icon="inline-start" aria-hidden />
      {label}
      {accuracy !== undefined && <span>· {Math.round(accuracy)}</span>}
    </Badge>
  );
}
