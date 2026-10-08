"use client";

import type { ReactNode } from "react";

import { FormulaPopover } from "@/components/shared/formula-popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SCENARIOS } from "@/lib/domain";
import {
  EMPTY,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";

import { FORMULAS, workedCashOnCash, workedOutOfPocket } from "./formulas";
import { useLiveCalc } from "./use-live-calc";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${number}`} className="space-y-2">
      <h3
        id={`step-${number}`}
        className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-full bg-secondary text-[0.7rem] text-secondary-foreground"
        >
          {number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/**
 * The cost → earn → return chain, always visible while the trainee works.
 * A live preview; the server confirms the numbers on the Review tab.
 */
export function SummaryRail() {
  const calc = useLiveCalc();
  const { financing, scenarios, taxes, prr } = calc;

  return (
    <aside
      aria-label="Deal summary"
      className="lg:sticky lg:top-6 lg:self-start"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Deal summary</h2>
          </CardTitle>
          <CardDescription>Live preview, updated as you type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Step number={1} title="What it costs up front">
            {financing ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-sm">
                  Total out of pocket
                  <FormulaPopover
                    label="Total out of pocket"
                    formula={FORMULAS.outOfPocket}
                    worked={workedOutOfPocket(calc)}
                  />
                </span>
                <span className="font-heading text-xl font-bold tabular-nums">
                  {formatCurrency(financing.totalOutOfPocket)}
                </span>
              </div>
            ) : (
              <Hint>Add purchase &amp; financing to see this.</Hint>
            )}
          </Step>

          <Step number={2} title="What it earns each year">
            {scenarios ? (
              <table className="w-full text-sm tabular-nums">
                <caption className="sr-only">
                  Net operating income and free cash flow
                </caption>
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="text-left font-normal">
                      <span className="sr-only">Line</span>
                    </th>
                    {SCENARIOS.map((name) => (
                      <th
                        key={name}
                        scope="col"
                        className="text-right font-normal capitalize"
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="text-left font-normal">
                      NOI
                    </th>
                    {SCENARIOS.map((name) => (
                      <td key={name} className="text-right">
                        {formatCompactCurrency(
                          scenarios[name].netOperatingIncome,
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-semibold">
                    <th scope="row" className="text-left font-semibold">
                      Free cash flow
                    </th>
                    {SCENARIOS.map((name) => {
                      const value = scenarios[name].freeCashFlow;
                      return (
                        <td
                          key={name}
                          className={cn(
                            "text-right",
                            value != null && value < 0 && "text-destructive",
                          )}
                        >
                          {value == null ? EMPTY : formatCompactCurrency(value)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            ) : (
              <Hint>
                Add the Low, Mid and High revenue forecasts to see this.
              </Hint>
            )}
          </Step>

          <Step number={3} title="How good the return is">
            {scenarios && financing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {SCENARIOS.map((name) => {
                    const value = scenarios[name].cashOnCash;
                    return (
                      <div
                        key={name}
                        className={cn(
                          "rounded-lg px-1 py-2",
                          name === "mid"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary",
                        )}
                      >
                        <p className="text-[0.7rem] capitalize opacity-80">
                          {name}
                        </p>
                        <p className="font-heading text-base font-bold tabular-nums">
                          {formatPercent(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  Cash-on-Cash
                  <FormulaPopover
                    label="Cash-on-Cash"
                    formula={FORMULAS.cashOnCash}
                    worked={workedCashOnCash(calc)}
                  />
                </p>
              </div>
            ) : (
              <Hint>
                Needs purchase &amp; financing and the revenue forecasts.
              </Hint>
            )}
          </Step>

          <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Tax savings</dt>
              <dd className="font-semibold tabular-nums">
                {formatCurrency(taxes?.taxSavings)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">PRR</dt>
              <dd className="font-semibold tabular-nums">
                {formatPercent(prr)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </aside>
  );
}
