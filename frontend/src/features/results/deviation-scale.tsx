import { formatCurrency, formatPercent } from "@/lib/format";
import { deviationDirection, thresholdLabel } from "@/lib/score";
import { cn } from "@/lib/utils";

type DeviationScaleProps = {
  candidate: number;
  reference: number;
  bestThreshold: number;
  mediumThreshold: number;
};

/**
 * Where the trainee's Mid forecast landed relative to the analyst's, on a
 * strip coloured by score band (Low | Medium | Best | Medium | Low).
 */
export function DeviationScale({
  candidate,
  reference,
  bestThreshold,
  mediumThreshold,
}: DeviationScaleProps) {
  const signed = (candidate - reference) / reference;
  // Show at least ±40%, wider when the forecast is further out.
  const range = Math.max(0.4, Math.abs(signed) * 1.15);
  const x = (value: number) => 50 + (value / range) * 50;
  const clamp = (percent: number) => Math.min(98, Math.max(2, percent));

  const zones = [
    { from: -range, to: -mediumThreshold, className: "bg-danger/20" },
    {
      from: -mediumThreshold,
      to: -bestThreshold,
      className: "bg-warning/25",
    },
    { from: -bestThreshold, to: bestThreshold, className: "bg-success/30" },
    { from: bestThreshold, to: mediumThreshold, className: "bg-warning/25" },
    { from: mediumThreshold, to: range, className: "bg-danger/20" },
  ];
  const ticks = [
    -mediumThreshold,
    -bestThreshold,
    0,
    bestThreshold,
    mediumThreshold,
  ];
  const direction = deviationDirection(candidate, reference);
  const summary =
    direction === "exact"
      ? "Your forecast matched the analyst's exactly."
      : `Your forecast was ${formatPercent(Math.abs(signed))} ${direction} the analyst's. Best is within ${thresholdLabel(bestThreshold)}, Medium within ${thresholdLabel(mediumThreshold)}.`;

  return (
    <figure className="space-y-2">
      {/* One image for screen readers; the strip's parts are decorative. */}
      <div role="img" aria-label={summary} className="relative pt-7 pb-6">
        <div className="relative h-3 overflow-hidden rounded-full">
          {zones.map((zone) => (
            <div
              key={`${zone.from}`}
              className={cn("absolute inset-y-0", zone.className)}
              style={{
                left: `${x(zone.from)}%`,
                width: `${x(zone.to) - x(zone.from)}%`,
              }}
            />
          ))}
        </div>

        {/* Analyst: the centre line */}
        <div className="absolute top-5 bottom-4 left-1/2 w-0.5 -translate-x-1/2 bg-foreground/60" />
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground">
          Analyst {formatCurrency(reference)}
        </span>

        {/* Trainee: a marker on the strip */}
        <div
          className="absolute top-[1.45rem] size-5 -translate-x-1/2 rounded-full border-2 border-background bg-primary shadow"
          style={{ left: `${clamp(x(signed))}%` }}
        />

        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute bottom-0 -translate-x-1/2 text-[0.7rem] text-muted-foreground tabular-nums"
            style={{ left: `${x(tick)}%` }}
          >
            {tick === 0
              ? "0"
              : `${tick > 0 ? "+" : "−"}${thresholdLabel(Math.abs(tick))}`}
          </span>
        ))}
      </div>
      <figcaption className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-3 rounded-full bg-primary" aria-hidden />
        You: {formatCurrency(candidate)}
      </figcaption>
    </figure>
  );
}
