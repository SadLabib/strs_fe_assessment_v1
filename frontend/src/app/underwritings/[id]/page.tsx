import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { toFormValues } from "@/features/workspace/mappers";
import { PropertyContext } from "@/features/workspace/property-context";
import { Workspace } from "@/features/workspace/workspace";
import {
  getMarket,
  getProperty,
  getUnderwriting,
  listSubmissions,
} from "@/lib/api/endpoints";
import { isNotFound } from "@/lib/api/errors";
import type { Underwriting } from "@/lib/api/schemas";
import { routes } from "@/lib/routes";

const ID = /^[1-9]\d{0,9}$/;

async function loadUnderwriting(rawId: string) {
  if (!ID.test(rawId)) notFound();
  try {
    // References (the answer key) come back as not found too.
    return await getUnderwriting(Number(rawId));
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}

/** Missing context shouldn't block the workspace itself. */
async function orNullIfMissing<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function streetOf(underwriting: Underwriting) {
  return (
    underwriting.property_address?.split(",")[0] ??
    `Underwriting ${underwriting.id}`
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/underwritings/[id]">): Promise<Metadata> {
  const underwriting = await loadUnderwriting((await params).id);
  return { title: `Underwrite ${streetOf(underwriting)}` };
}

export default async function UnderwritingPage({
  params,
}: PageProps<"/underwritings/[id]">) {
  const underwriting = await loadUnderwriting((await params).id);
  const { zpid, market_id: marketId } = underwriting;

  // A submitted attempt is final: show its results instead of the form.
  if (underwriting.deal_submitted) {
    const submissions = zpid ? await listSubmissions(zpid) : [];
    const submission = submissions.find(
      (s) => s.underwriting_id === underwriting.id,
    );
    redirect(
      submission ? routes.submission(submission.id) : routes.dashboard(),
    );
  }

  const [property, market] = await Promise.all([
    zpid ? orNullIfMissing(() => getProperty(zpid)) : null,
    marketId ? orNullIfMissing(() => getMarket(marketId)) : null,
  ]);
  const location = property
    ? [property.address_city, property.address_state].filter(Boolean).join(", ")
    : "";

  return (
    <div className="space-y-6">
      {zpid && (
        <Link
          href={routes.property(zpid)}
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Property brief
        </Link>
      )}

      <PageHeader
        title={`Underwrite ${streetOf(underwriting)}`}
        description={location}
      />

      {property && <PropertyContext property={property} market={market} />}

      <Workspace
        underwritingId={underwriting.id}
        defaultValues={toFormValues(underwriting)}
      />
    </div>
  );
}
