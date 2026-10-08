"use client";

import { RotateCcwIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

import { DerivedFacts } from "../derived-facts";
import { NumberField } from "../fields";
import { TAX_DEFAULTS, type FormValues } from "../schema";
import { useLiveCalc } from "../use-live-calc";

export function Taxes() {
  const { setValue } = useFormContext<FormValues>();
  const { taxes } = useLiveCalc();

  function resetToDefaults() {
    for (const [key, value] of Object.entries(TAX_DEFAULTS)) {
      setValue(`taxes.${key as keyof typeof TAX_DEFAULTS}`, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Taxes</h2>
        </CardTitle>
        <CardDescription>
          Estimates the first-year tax savings from depreciation. Most training
          deals use the defaults: 20%, 25%, 60% and 37%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            name="taxes.landPct"
            label="Land value"
            suffix="%"
            description="Share of the price that is land and can't be depreciated"
          />
          <NumberField
            name="taxes.slaPct"
            label="Short-life assets"
            suffix="%"
            description="Share of the improvements that depreciates quickly"
          />
          <NumberField
            name="taxes.bonusPct"
            label="Bonus depreciation"
            suffix="%"
            description="Share of short-life assets written off in year one"
          />
          <NumberField
            name="taxes.taxRatePct"
            label="Tax rate"
            suffix="%"
            description="The investor's combined federal and state rate"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
        >
          <RotateCcwIcon data-icon="inline-start" aria-hidden />
          Reset to training defaults
        </Button>

        <DerivedFacts
          emptyHint="Needs the purchase price and all four tax rates."
          facts={
            taxes && [
              {
                label: "Improvement basis",
                value: formatCurrency(taxes.improvementBasis),
              },
              {
                label: "Short-life assets",
                value: formatCurrency(taxes.shortLifeAssets),
              },
              {
                label: "Year-one depreciation",
                value: formatCurrency(taxes.yearOneDepreciation),
              },
              { label: "Tax savings", value: formatCurrency(taxes.taxSavings) },
            ]
          }
        />
      </CardContent>
    </Card>
  );
}
