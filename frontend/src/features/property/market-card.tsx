import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Market } from "@/lib/api/schemas";

export function MarketCard({ market }: { market: Market }) {
  const area = [market.region, market.state].filter(Boolean).join(" · ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Market</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="font-semibold">{market.name}</p>
          {area && <p className="text-sm text-muted-foreground">{area}</p>}
        </div>
        {market.description && (
          <p className="text-sm leading-relaxed">{market.description}</p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {market.property_count} training{" "}
        {market.property_count === 1 ? "property" : "properties"} in this market
      </CardFooter>
    </Card>
  );
}
