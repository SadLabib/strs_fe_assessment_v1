import { StatTile } from "@/components/shared/stat-tile";
import { Progress } from "@/components/ui/progress";
import type { Dashboard } from "@/lib/api/schemas";
import { EMPTY } from "@/lib/format";

export function KpiStrip({ dashboard }: { dashboard: Dashboard }) {
  const { summary, properties } = dashboard;
  // The API's own status flips back to "in progress" when a retry is started,
  // so count every property with a graded attempt as completed.
  const completed = properties.filter(
    (property) => property.attempts > 0,
  ).length;
  const total = summary.total_properties;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section
      aria-label="Training progress"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      <StatTile
        label="Completed"
        value={`${completed} / ${total}`}
        hint={`${percent}% of training cases`}
      >
        <Progress
          value={percent}
          aria-label="Training cases completed"
          className="mt-2"
        />
      </StatTile>
      <StatTile
        label="Average score"
        value={
          summary.average_accuracy == null
            ? EMPTY
            : Math.round(summary.average_accuracy)
        }
        hint="Out of 100, latest attempt per case"
      />
      <StatTile
        label="In progress"
        value={summary.in_progress}
        hint="Drafts you can resume"
      />
      <StatTile
        label="Not started"
        value={summary.not_started}
        hint="Cases waiting for you"
      />
    </section>
  );
}
