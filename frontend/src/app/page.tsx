import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { caseAction, nextCase } from "@/features/dashboard/case-action";
import { KpiStrip } from "@/features/dashboard/kpi-strip";
import { PropertyCard } from "@/features/dashboard/property-card";
import { getDashboard } from "@/lib/api/endpoints";

export default async function DashboardPage() {
  const dashboard = await getDashboard();
  const next = nextCase(dashboard.properties);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Training dashboard"
        description="Pick a property, underwrite it, and see how close your revenue forecast lands to the analyst's."
        actions={
          next && (
            <Button asChild variant="cta" size="lg">
              <Link href={caseAction(next).href}>
                {next.status === "in_progress"
                  ? "Resume your draft"
                  : "Start next case"}
              </Link>
            </Button>
          )
        }
      />

      <KpiStrip dashboard={dashboard} />

      <section aria-labelledby="cases-heading" className="space-y-4">
        <h2 id="cases-heading" className="font-heading text-lg font-semibold">
          Training cases
        </h2>
        {dashboard.properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No training cases yet. Check that the training data has been seeded.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.properties.map((property) => (
              <li key={property.zpid}>
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
