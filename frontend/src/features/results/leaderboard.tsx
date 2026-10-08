import Link from "next/link";

import { RatingBadge } from "@/components/shared/rating-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatPercent } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { routes } from "@/lib/routes";
import { deviationDirection } from "@/lib/score";
import { cn } from "@/lib/utils";

const MAX_ROWS = 10;

function offBy({ submission }: LeaderboardEntry) {
  const { candidate, reference, deviation } = submission.breakdown;
  const direction = deviationDirection(candidate, reference);
  if (direction === null) return "no forecast";
  if (direction === "exact") return "exact";
  return `${formatPercent(deviation)} ${direction}`;
}

export function Leaderboard({
  entries,
  current,
}: {
  entries: LeaderboardEntry[];
  current: LeaderboardEntry | null;
}) {
  // Always show this attempt, even when it's below the cut-off.
  const shown = entries.filter(
    (entry, index) => index < MAX_ROWS || entry.isCurrent,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Leaderboard</h2>
        </CardTitle>
        <CardDescription>
          Attempts on this property, closest to the analyst first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {current && (
          <p className="font-heading text-3xl font-bold tabular-nums">
            #{current.rank}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              of {entries.length}{" "}
              {entries.length === 1 ? "attempt" : "attempts"}
            </span>
          </p>
        )}
        <ol className="divide-y rounded-lg ring-1 ring-foreground/10">
          {shown.map((entry) => (
            <li
              key={entry.submission.id}
              aria-current={entry.isCurrent ? "true" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm",
                entry.isCurrent && "bg-secondary",
              )}
            >
              <span className="w-7 font-semibold tabular-nums">
                #{entry.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  {entry.isCurrent ? (
                    <span className="font-medium">Attempt {entry.attempt}</span>
                  ) : (
                    <Link
                      href={routes.submission(entry.submission.id)}
                      className="rounded-sm hover:underline"
                    >
                      Attempt {entry.attempt}
                    </Link>
                  )}
                  {entry.isCurrent && (
                    <Badge variant="outline">This attempt</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {offBy(entry)} ·{" "}
                  {formatDateTime(entry.submission.submitted_at)}
                </p>
              </div>
              <RatingBadge
                rating={entry.submission.rating}
                accuracy={entry.submission.accuracy}
              />
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          The training API doesn&apos;t track individual trainees yet, so this
          ranks your own attempts.
        </p>
      </CardContent>
    </Card>
  );
}
