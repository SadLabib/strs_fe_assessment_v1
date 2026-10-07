import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
};

export function StatTile({ label, value, hint, children }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
