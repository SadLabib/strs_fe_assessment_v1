import Image from "next/image";
import { ExternalLinkIcon, HouseIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Property } from "@/lib/api/schemas";
import { EMPTY, formatCurrency, formatNumber, humanize } from "@/lib/format";

export function PropertyBrief({ property }: { property: Property }) {
  const facts = [
    { label: "List price", value: formatCurrency(property.unformatted_price) },
    { label: "Bedrooms", value: formatNumber(property.beds) },
    { label: "Bathrooms", value: formatNumber(property.baths) },
    {
      label: "Living area",
      value:
        property.area == null ? EMPTY : `${formatNumber(property.area)} sq ft`,
    },
    { label: "Home type", value: humanize(property.home_type) },
    { label: "Time on market", value: property.time_on_zillow ?? EMPTY },
  ];

  return (
    <Card className="pt-0">
      <div className="relative aspect-[2/1] bg-secondary">
        {property.img_src ? (
          <Image
            src={property.img_src}
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-primary/40">
            <HouseIcon className="size-12" aria-hidden />
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle>
          <h2>Property</h2>
        </CardTitle>
        {property.address && (
          <p className="text-sm text-muted-foreground">{property.address}</p>
        )}
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>

      {property.detail_url && (
        <CardFooter>
          <a
            href={property.detail_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline"
          >
            View listing on Zillow
            <ExternalLinkIcon className="size-3.5" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
