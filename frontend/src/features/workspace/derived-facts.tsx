type Fact = { label: string; value: string };

/** Live results under a section, or a hint about what's still missing. */
export function DerivedFacts({
  facts,
  emptyHint,
}: {
  facts: Fact[] | null;
  emptyHint: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/60 px-4 py-3">
      {facts ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      )}
    </div>
  );
}
