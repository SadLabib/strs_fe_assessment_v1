import Link from "next/link";

import { RatingBadge } from "@/components/shared/rating-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Submission } from "@/lib/api/schemas";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { describeDeviation } from "@/lib/score";

/** Graded attempts on one property, newest first (the API's order). */
export function AttemptHistory({ submissions }: { submissions: Submission[] }) {
  return (
    <section aria-labelledby="attempts-heading" className="space-y-3">
      <h2 id="attempts-heading" className="font-heading text-lg font-semibold">
        Your attempts
      </h2>
      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No graded attempts yet. They&apos;ll appear here after you submit.
        </p>
      ) : (
        <Card className="py-0">
          <ol className="divide-y">
            {submissions.map((submission, index) => (
              <li
                key={submission.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RatingBadge
                      rating={submission.rating}
                      accuracy={submission.accuracy}
                    />
                    <span className="text-xs text-muted-foreground">
                      Attempt {submissions.length - index}
                    </span>
                  </div>
                  <p className="text-sm tabular-nums">
                    Mid forecast{" "}
                    {formatCurrency(submission.breakdown.candidate)} ·{" "}
                    {describeDeviation(submission.breakdown)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={submission.submitted_at}>
                      {formatDateTime(submission.submitted_at)}
                    </time>
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={routes.submission(submission.id)}>
                    View results
                  </Link>
                </Button>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}
