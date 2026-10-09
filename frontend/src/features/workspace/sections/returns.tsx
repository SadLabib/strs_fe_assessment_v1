"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { FormulaPopover } from "@/components/shared/formula-popover";
import { StatTile } from "@/components/shared/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScenarioResult } from "@/lib/calc/underwriting";
import { SCENARIOS } from "@/lib/domain";
import { EMPTY, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  FORMULAS,
  workedCashOnCash,
  workedFreeCashFlow,
  workedNoi,
  workedPrr,
  workedTaxSavings,
} from "../formulas";
import type { FormValues } from "../schema";
import { useLiveCalc } from "../use-live-calc";

/** Deductions show as negatives, without turning 0 into "−$0". */
const negate = (value: number) => (value === 0 ? 0 : -value);

type Row = {
  label: string;
  value: (scenario: ScenarioResult) => number | null;
  format?: (value: number) => string;
  formula?: { text: string; worked: string | null };
  emphasis?: boolean;
};

export function Returns() {
  const calc = useLiveCalc();
  const { control } = useFormContext<FormValues>();
  const [taxRatePct, price] = useWatch({
    control,
    name: ["taxes.taxRatePct", "purchase.price"],
  });
  const { scenarios, financing, taxes, prr } = calc;

  const rows: Row[] = [
    { label: "Revenue", value: (s) => s.revenue },
    { label: "Operating expenses", value: (s) => negate(s.operatingExpenses) },
    { label: "Co-hosting fee", value: (s) => negate(s.coHostingFee) },
    {
      label: "Net operating income",
      value: (s) => s.netOperatingIncome,
      formula: { text: FORMULAS.noi, worked: workedNoi(scenarios?.mid) },
      emphasis: true,
    },
    {
      label: "Debt service",
      value: () => (financing ? negate(financing.annualDebtService) : null),
    },
    {
      label: "Annual free cash flow",
      value: (s) => s.freeCashFlow,
      formula: {
        text: FORMULAS.freeCashFlow,
        worked: workedFreeCashFlow(calc),
      },
      emphasis: true,
    },
    {
      label: "Cash-on-Cash",
      value: (s) => s.cashOnCash,
      format: formatPercent,
      formula: { text: FORMULAS.cashOnCash, worked: workedCashOnCash(calc) },
      emphasis: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Returns</h2>
        </CardTitle>
        <CardDescription>
          Calculated live from your inputs. Low and High adjust operating
          expenses by ×0.96 and ×1.04.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {scenarios ? (
          // On phones: smaller type and wrapping labels keep all three
          // scenarios in view instead of scrolling sideways.
          <Table className="text-xs sm:text-sm">
            <TableCaption className="sr-only">
              Annual returns for each revenue scenario
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">
                  <span className="sr-only">Line</span>
                </TableHead>
                {SCENARIOS.map((name) => (
                  <TableHead
                    key={name}
                    scope="col"
                    className="px-1.5 text-right capitalize sm:px-2"
                  >
                    {name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.label}
                  className={cn(row.emphasis && "font-semibold")}
                >
                  <TableHead
                    scope="row"
                    className={cn(
                      "px-1.5 whitespace-normal text-foreground sm:px-2",
                      row.emphasis ? "font-semibold" : "font-normal",
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {row.label}
                      {row.formula && (
                        <FormulaPopover
                          label={row.label}
                          formula={row.formula.text}
                          worked={row.formula.worked}
                        />
                      )}
                    </span>
                  </TableHead>
                  {SCENARIOS.map((name) => {
                    const value = row.value(scenarios[name]);
                    return (
                      <TableCell
                        key={name}
                        className={cn(
                          "px-1.5 text-right tabular-nums sm:px-2",
                          value != null &&
                            value < 0 &&
                            row.emphasis &&
                            "text-destructive",
                        )}
                      >
                        {value == null
                          ? EMPTY
                          : (row.format ?? formatCurrency)(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="rounded-lg bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            Enter all three revenue forecasts to see the returns.
          </p>
        )}
        {scenarios && !financing && (
          <p className="text-sm text-muted-foreground">
            Fill in purchase &amp; financing to see debt service, free cash flow
            and Cash-on-Cash.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            label="Tax savings (year one)"
            value={formatCurrency(taxes?.taxSavings)}
            hint={
              <span className="inline-flex items-center gap-1">
                From depreciation
                <FormulaPopover
                  label="Tax savings"
                  formula={FORMULAS.taxSavings}
                  worked={workedTaxSavings(calc, taxRatePct)}
                />
              </span>
            }
          />
          <StatTile
            label="PRR"
            value={formatPercent(prr)}
            hint={
              <span className="inline-flex items-center gap-1">
                How hard the property works for its price
                <FormulaPopover
                  label="PRR"
                  formula={FORMULAS.prr}
                  worked={workedPrr(calc, price)}
                />
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
