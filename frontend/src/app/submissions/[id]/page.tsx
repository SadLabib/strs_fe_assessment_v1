import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Leaderboard } from "@/features/results/leaderboard";
import { NextSteps } from "@/features/results/next-steps";
import { ScoreHero } from "@/features/results/score-hero";
import {
  getDashboard,
  getProperty,
  getSubmission,
  listSubmissions,
} from "@/lib/api/endpoints";
import { isNotFound } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { rankAttempts } from "@/lib/leaderboard";
import { routes } from "@/lib/routes";

const ID = /^[1-9]\d{0,9}$/;

async function loadSubmission(rawId: string) {
  if (!ID.test(rawId)) notFound();
  try {
    return await getSubmission(Number(rawId));
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}

async function loadStreet(zpid: string) {
  try {
    const property = await getProperty(zpid);
    return property.address_street ?? property.address ?? `Property ${zpid}`;
  } catch (error) {
    if (isNotFound(error)) return `Property ${zpid}`;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/submissions/[id]">): Promise<Metadata> {
  const submission = await loadSubmission((await params).id);
  return { title: `Results for ${await loadStreet(submission.zpid)}` };
}

export default async function SubmissionPage({
  params,
}: PageProps<"/submissions/[id]">) {
  const submission = await loadSubmission((await params).id);
  const [street, attempts, dashboard] = await Promise.all([
    loadStreet(submission.zpid),
    listSubmissions(submission.zpid),
    getDashboard(),
  ]);

  const { entries, current } = rankAttempts(attempts, submission.id);
  const draftId =
    dashboard.properties.find((row) => row.zpid === submission.zpid)
      ?.active_underwriting_id ?? null;
  const nextProperty =
    dashboard.properties.find(
      (row) => row.zpid !== submission.zpid && row.status !== "submitted",
    ) ?? null;

  return (
    <div className="space-y-6">
      <Link
        href={routes.property(submission.zpid)}
        className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Property brief
      </Link>

      <PageHeader
        title={`Results for ${street}`}
        description={`Attempt ${current?.attempt ?? 1} · submitted ${formatDateTime(submission.submitted_at)}`}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ScoreHero submission={submission} />
        <div className="space-y-6">
          <Leaderboard entries={entries} current={current} />
          <NextSteps
            zpid={submission.zpid}
            rating={submission.rating}
            draftId={draftId}
            nextProperty={nextProperty}
          />
        </div>
      </div>
    </div>
  );
}
