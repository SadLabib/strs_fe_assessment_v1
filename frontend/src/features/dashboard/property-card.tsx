import Image from "next/image";
import Link from "next/link";
import { HouseIcon } from "lucide-react";

import { RatingBadge } from "@/components/shared/rating-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardProperty } from "@/lib/api/schemas";
import { formatCurrency, formatNumber } from "@/lib/format";
import { routes } from "@/lib/routes";

import { caseAction } from "./case-action";

export function PropertyCard({ property }: { property: DashboardProperty }) {
  const [street] = (property.address ?? `Property ${property.zpid}`).split(",");
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const facts = [
    property.beds != null && `${property.beds} bd`,
    property.baths != null && `${formatNumber(property.baths)} ba`,
    property.area != null && `${formatNumber(property.area)} sq ft`,
  ].filter(Boolean);
  const action = caseAction(property);

  return (
    <Card className="h-full pt-0">
      <div className="relative aspect-[2/1] bg-secondary">
        {property.img_src ? (
          <Image
            src={property.img_src}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-primary/40">
            <HouseIcon className="size-10" aria-hidden />
          </div>
        )}
      </div>

      <CardHeader>
        {property.market_name && (
          <p className="text-xs font-medium text-muted-foreground">
            {property.market_name}
          </p>
        )}
        <h3 className="font-heading text-base leading-snug font-semibold">
          <Link
            href={routes.property(property.zpid)}
            className="rounded-sm hover:underline"
          >
            {street}
          </Link>
        </h3>
        {location && (
          <p className="text-sm text-muted-foreground">{location}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm tabular-nums">
          <span className="font-semibold">
            {formatCurrency(property.unformatted_price)}
          </span>
          {facts.length > 0 && (
            <span className="text-muted-foreground">
              {" "}
              · {facts.join(" · ")}
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={property.status} />
          {property.latest_rating && property.latest_accuracy != null && (
            <RatingBadge
              rating={property.latest_rating}
              accuracy={property.latest_accuracy}
            />
          )}
        </div>
        {property.attempts > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {property.attempts}{" "}
            {property.attempts === 1 ? "attempt" : "attempts"}
            {property.best_accuracy != null &&
              ` · top score ${Math.round(property.best_accuracy)}`}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild className="flex-1">
          <Link href={action.href}>{action.label}</Link>
        </Button>
        {property.status === "submitted" && (
          <Button asChild variant="ghost">
            <Link href={routes.property(property.zpid)}>Try again</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
