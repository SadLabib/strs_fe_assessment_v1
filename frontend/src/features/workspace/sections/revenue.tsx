"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { NumberField } from "../fields";
import type { FormValues } from "../schema";

export function Revenue() {
  const { control, trigger, getFieldState } = useFormContext<FormValues>();
  const [low, mid] = useWatch({
    control,
    name: ["revenue.low", "revenue.mid"],
  });

  // Low ≤ Mid ≤ High: re-check the neighbour when one side changes, but only
  // once the trainee has visited it (no "required" errors on untouched fields).
  useEffect(() => {
    if (getFieldState("revenue.mid").isTouched) void trigger("revenue.mid");
  }, [low, getFieldState, trigger]);
  useEffect(() => {
    if (getFieldState("revenue.high").isTouched) void trigger("revenue.high");
  }, [mid, getFieldState, trigger]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Revenue forecast</h2>
        </CardTitle>
        <CardDescription>
          Three annual revenue forecasts: a cautious year, an expected year and
          a strong year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            name="revenue.low"
            label="Low"
            prefix="$"
            grouping
            description="A cautious year"
          />
          <NumberField
            name="revenue.mid"
            label={
              <>
                Mid
                <Badge
                  variant="outline"
                  className="border-cta text-cta-foreground"
                >
                  Graded
                </Badge>
              </>
            }
            prefix="$"
            grouping
            description="The expected year. Your score depends on this number."
          />
          <NumberField
            name="revenue.high"
            label="High"
            prefix="$"
            grouping
            description="A strong year"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            name="revenue.coHostingFeePct"
            label="Co-hosting fee"
            suffix="%"
            description="Share of revenue paid to a co-host. Leave 0 if the owner self-manages."
          />
          <NumberField
            name="revenue.appreciationPct"
            label="Annual appreciation"
            suffix="%"
            description="How much the property's value grows each year"
          />
        </div>
      </CardContent>
    </Card>
  );
}
