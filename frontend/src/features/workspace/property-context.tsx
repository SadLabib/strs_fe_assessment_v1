import { ChevronDownIcon } from "lucide-react";

import type { Market, Property } from "@/lib/api/schemas";
import { EMPTY, formatCurrency, formatNumber, humanize } from "@/lib/format";

/**
 * Collapsible reminder of the property and market while forecasting.
 * Native <details>, so it works without any JavaScript.
 */
export function PropertyContext({
  property,
  market,
}: {
  property: Property;
  market: Market | null;
}) {
  const facts = [
    { label: "List price", value: formatCurrency(property.unformatted_price) },
    {
      label: "Beds / baths",
      value: `${formatNumber(property.beds)} / ${formatNumber(property.baths)}`,
    },
    {
      label: "Living area",
      value:
        property.area == null ? EMPTY : `${formatNumber(property.area)} sq ft`,
    },
    { label: "Home type", value: humanize(property.home_type) },
  ];

  return (
    <details className="group rounded-xl bg-card ring-1 ring-foreground/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Property &amp; market
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="grid gap-6 border-t px-4 py-4 text-sm md:grid-cols-2">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="font-semibold tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
        {market && (
          <div className="space-y-1">
            <p className="font-semibold">{market.name}</p>
            {market.description && (
              <p className="leading-relaxed text-muted-foreground">
                {market.description}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
