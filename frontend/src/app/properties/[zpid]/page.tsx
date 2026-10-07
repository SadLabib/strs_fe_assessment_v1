import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AttemptHistory } from "@/features/property/attempt-history";
import { HowItWorks } from "@/features/property/how-it-works";
import { MarketCard } from "@/features/property/market-card";
import { PropertyBrief } from "@/features/property/property-brief";
import { StartButton } from "@/features/property/start-button";
import {
  getDashboard,
  getMarket,
  getProperty,
  listSubmissions,
} from "@/lib/api/endpoints";
import { isNotFound } from "@/lib/api/errors";
import { routes } from "@/lib/routes";

const ZPID = /^\d{1,12}$/;

async function loadProperty(zpid: string) {
  if (!ZPID.test(zpid)) notFound();
  try {
    return await getProperty(zpid);
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}

async function loadMarket(id: number | null) {
  if (id == null) return null;
  try {
    return await getMarket(id);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/properties/[zpid]">): Promise<Metadata> {
  const property = await loadProperty((await params).zpid);
  return { title: property.address_street ?? property.address ?? "Property" };
}

export default async function PropertyPage({
  params,
}: PageProps<"/properties/[zpid]">) {
  const { zpid } = await params;
  const property = await loadProperty(zpid);
  const [dashboard, submissions, market] = await Promise.all([
    getDashboard(),
    listSubmissions(zpid),
    loadMarket(property.market_id),
  ]);

  const draftId =
    dashboard.properties.find((row) => row.zpid === zpid)
      ?.active_underwriting_id ?? null;
  const street =
    property.address_street ?? property.address ?? `Property ${zpid}`;
  const location = [property.address_city, property.address_state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <Link
        href={routes.dashboard()}
        className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Training dashboard
      </Link>

      <PageHeader
        title={street}
        description={location}
        actions={
          draftId != null ? (
            <Button asChild variant="cta" size="lg">
              <Link href={routes.underwriting(draftId)}>Resume draft</Link>
            </Button>
          ) : (
            <StartButton
              zpid={zpid}
              label={
                submissions.length > 0 ? "Try again" : "Start underwriting"
              }
            />
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PropertyBrief property={property} />
        <div className="space-y-6">
          {market && <MarketCard market={market} />}
          <HowItWorks />
        </div>
      </div>

      <AttemptHistory submissions={submissions} />
    </div>
  );
}
