import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartButton } from "@/features/property/start-button";
import type { DashboardProperty } from "@/lib/api/schemas";
import type { Rating } from "@/lib/domain";
import { routes } from "@/lib/routes";

type NextStepsProps = {
  zpid: string;
  rating: Rating;
  /** An open draft on this property, if one exists. */
  draftId: number | null;
  nextProperty: DashboardProperty | null;
};

/** One amber action: move on after a Best, otherwise try again. */
export function NextSteps({
  zpid,
  rating,
  draftId,
  nextProperty,
}: NextStepsProps) {
  const moveOn = rating === "best" && nextProperty != null;
  const nextStreet = nextProperty?.address?.split(",")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>What next?</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {draftId != null ? (
          <Button asChild variant={moveOn ? "outline" : "cta"} size="lg">
            <Link href={routes.underwriting(draftId)}>
              Resume your new draft
            </Link>
          </Button>
        ) : (
          <StartButton
            zpid={zpid}
            label="Try again"
            variant={moveOn ? "outline" : "cta"}
          />
        )}
        {nextProperty && (
          <Button asChild variant={moveOn ? "cta" : "outline"} size="lg">
            <Link href={routes.property(nextProperty.zpid)}>
              Next property: {nextStreet}
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href={routes.dashboard()}>Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
