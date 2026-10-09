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
import { SCENARIOS, type Scenario } from "@/lib/domain";
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
              // Labels sit above the numbers, so the three columns get the
              // full width and line up with the Cash-on-Cash tiles below.
              <div className="space-y-3">
                <div
                  aria-hidden
                  className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground capitalize"
                >
                  {SCENARIOS.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
                <dl className="space-y-3">
                  {[
                    {
                      label: "Net operating income",
                      strong: false,
                      value: (name: Scenario) =>
                        scenarios[name].netOperatingIncome,
                    },
                    {
                      label: "Free cash flow",
                      strong: true,
                      value: (name: Scenario) => scenarios[name].freeCashFlow,
                    },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <dt
                        className={cn(
                          "text-xs",
                          row.strong
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {row.label}
                      </dt>
                      <dd
                        className={cn(
                          "grid grid-cols-3 gap-2 text-center text-sm tabular-nums",
                          row.strong && "font-semibold",
                        )}
                      >
                        {SCENARIOS.map((name) => {
                          const value = row.value(name);
                          return (
                            <span
                              key={name}
                              className={cn(
                                value != null &&
                                  value < 0 &&
                                  "text-destructive",
                              )}
                            >
                              <span className="sr-only">{name}: </span>
                              {value == null
                                ? EMPTY
                                : formatCompactCurrency(value)}
                            </span>
                          );
                        })}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
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
