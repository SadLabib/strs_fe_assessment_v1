import { RatingBadge } from "@/components/shared/rating-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Submission } from "@/lib/api/schemas";
import type { Rating } from "@/lib/domain";
import { formatCurrency, formatPercent } from "@/lib/format";
import { deviationDirection, scoreBands, thresholdLabel } from "@/lib/score";
import { cn } from "@/lib/utils";

import { DeviationScale } from "./deviation-scale";

const SCORE_STYLES: Record<Rating, string> = {
  best: "bg-success-soft text-success ring-success/30",
  medium: "bg-warning-soft text-warning ring-warning/30",
  low: "bg-danger-soft text-danger ring-danger/30",
};

/** Explains the grade in words, not just a number. */
function explanation({ rating, breakdown }: Submission) {
  const { candidate, reference, deviation, best_threshold, medium_threshold } =
    breakdown;
  if (candidate == null || reference == null) {
    return "No Mid forecast was submitted, so this attempt scores 40.";
  }

  const direction = deviationDirection(candidate, reference);
  const versus =
    direction === "exact"
      ? `Your Mid forecast of ${formatCurrency(candidate)} matched the analyst's exactly`
      : `Your Mid forecast of ${formatCurrency(candidate)} was ${formatPercent(deviation)} ${direction} the analyst's ${formatCurrency(reference)}`;

  if (rating === "best") {
    return `${versus}, inside the ±${thresholdLabel(best_threshold)} band for Best.`;
  }
  if (rating === "medium") {
    return `${versus}. That's within ±${thresholdLabel(medium_threshold)} (Medium); within ±${thresholdLabel(best_threshold)} would have scored 100.`;
  }
  return `${versus}, more than ${thresholdLabel(medium_threshold)} away (Low).`;
}

export function ScoreHero({ submission }: { submission: Submission }) {
  const { rating, accuracy, breakdown } = submission;
  const { candidate, reference, best_threshold, medium_threshold } = breakdown;
  const bands =
    reference != null
      ? scoreBands(reference, best_threshold, medium_threshold)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Your score</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex size-28 shrink-0 flex-col items-center justify-center rounded-full ring-4",
              SCORE_STYLES[rating],
            )}
          >
            <span className="font-heading text-4xl font-bold tabular-nums">
              {Math.round(accuracy)}
            </span>
            <span className="text-xs">out of 100</span>
          </div>
          <div className="space-y-2">
            <RatingBadge rating={rating} />
            <p className="text-base leading-relaxed">
              {explanation(submission)}
            </p>
          </div>
        </div>

        {candidate != null && reference != null && reference !== 0 && (
          <DeviationScale
            candidate={candidate}
            reference={reference}
            bestThreshold={best_threshold}
            mediumThreshold={medium_threshold}
          />
        )}

        {bands && (
          <dl className="grid gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                Best (100) needed
              </dt>
              <dd className="font-semibold tabular-nums">
                {formatCurrency(bands.best.low)} –{" "}
                {formatCurrency(bands.best.high)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Medium (70) needed
              </dt>
              <dd className="font-semibold tabular-nums">
                {formatCurrency(bands.medium.low)} –{" "}
                {formatCurrency(bands.medium.high)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
