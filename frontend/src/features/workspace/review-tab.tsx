"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useFormContext, useWatch, type FieldPath } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { SCENARIOS } from "@/lib/domain";
import { EMPTY, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { submitDraft } from "./actions";
import {
  reviewIssues,
  reviewWarnings,
  sectionStatuses,
  SECTIONS,
  type Section,
} from "./completeness";
import { toNumber, type FormValues } from "./schema";
import { SectionStatusIcon, statusLabel } from "./section-status-icon";
import type { Confirmed } from "./use-autosave";

type ReviewTabProps = {
  underwritingId: number;
  confirmed: Confirmed | null;
  isSaving: boolean;
  onGoToField: (path: FieldPath<FormValues>) => void;
  onBeforeSubmit: () => void;
};

/** Last stop before grading: what's missing, what the server calculated, and submit. */
export function ReviewTab({
  underwritingId,
  confirmed,
  isSaving,
  onGoToField,
  onBeforeSubmit,
}: ReviewTabProps) {
  const values = useWatch<FormValues>() as FormValues;
  const issues = useMemo(() => reviewIssues(values), [values]);
  const statuses = useMemo(() => sectionStatuses(values), [values]);
  const warnings = useMemo(() => reviewWarnings(values), [values]);
  const mid = toNumber(values.revenue.mid);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Checklist</h2>
          </CardTitle>
          <CardDescription>
            {issues.length === 0
              ? "Everything required is filled in."
              : `${issues.length} ${issues.length === 1 ? "item needs" : "items need"} attention before you can submit. Select one to jump to it.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y rounded-lg ring-1 ring-foreground/10">
            {(Object.keys(SECTIONS) as Section[]).map((section) => {
              const own = issues.filter((issue) => issue.section === section);
              return (
                <li key={section} className="space-y-2 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <SectionStatusIcon status={statuses[section]} />
                    {SECTIONS[section].label}
                    <span className="ml-auto text-xs font-normal text-muted-foreground capitalize">
                      {statusLabel(statuses[section])}
                    </span>
                  </p>
                  {own.length > 0 && (
                    <ul className="space-y-1 pl-6">
                      {own.map((issue) => (
                        <li key={`${issue.path}-${issue.message}`}>
                          <button
                            type="button"
                            onClick={() => onGoToField(issue.path)}
                            className={cn(
                              "rounded-sm text-left text-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                              // Missing values aren't mistakes: only wrong ones are red.
                              issue.blank ? "text-foreground" : "text-danger",
                            )}
                          >
                            {issue.message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {warnings.length > 0 && (
            <ul className="space-y-2">
              {warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning"
                >
                  <TriangleAlertIcon
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmedNumbers confirmed={confirmed} isSaving={isSaving} />
      <Assumptions values={values} />

      <Card className="ring-cta/60">
        <CardHeader>
          <CardTitle>
            <h2>Submit for grading</h2>
          </CardTitle>
          <CardDescription>
            You&apos;re graded on your Mid revenue forecast:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {Number.isFinite(mid) ? formatCurrency(mid) : EMPTY}
            </span>
            . Within 10% of the analyst scores 100, within 25% scores 70,
            anything further scores 40.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitPanel
            underwritingId={underwritingId}
            canSubmit={issues.length === 0}
            mid={formatCurrency(mid)}
            onBeforeSubmit={onBeforeSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmedNumbers({
  confirmed,
  isSaving,
}: {
  confirmed: Confirmed | null;
  isSaving: boolean;
}) {
  const summary = confirmed?.summary;
  const rows = summary
    ? [
        {
          label: "Net operating income",
          values: SCENARIOS.map((s) =>
            formatCurrency(summary.scenarios[s].netOperatingIncome),
          ),
        },
        {
          label: "Annual free cash flow",
          values: SCENARIOS.map((s) =>
            formatCurrency(summary.scenarios[s].freeCashFlow),
          ),
        },
        {
          label: "Cash-on-Cash",
          values: SCENARIOS.map((s) =>
            formatPercent(summary.scenarios[s].cashOnCash),
          ),
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Confirmed by the server</h2>
        </CardTitle>
        <CardDescription aria-live="polite">
          {isSaving
            ? "Saving your latest changes…"
            : confirmed
              ? `${summary ? "Calculated by the training API when your draft was saved" : "Draft saved"} at ${confirmed.at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`
              : "Saving your draft to get the server's numbers…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Total out of pocket
                </dt>
                <dd className="font-heading text-lg font-bold tabular-nums">
                  {formatCurrency(summary.totalOutOfPocket)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tax savings</dt>
                <dd className="font-heading text-lg font-bold tabular-nums">
                  {formatCurrency(summary.taxSavings)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">PRR</dt>
                <dd className="font-heading text-lg font-bold tabular-nums">
                  {formatPercent(summary.prr)}
                </dd>
              </div>
            </dl>
            <Table>
              <TableCaption className="sr-only">
                Server-calculated returns per scenario
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
                      className="text-right capitalize"
                    >
                      {name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableHead
                      scope="row"
                      className="font-normal text-foreground"
                    >
                      {row.label}
                    </TableHead>
                    {row.values.map((value, index) => (
                      <TableCell
                        key={SCENARIOS[index]}
                        className="text-right tabular-nums"
                      >
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {confirmed && confirmed.skipped.length > 0 && (
              <p className="text-sm text-warning">
                Some sections aren&apos;t saved yet because they&apos;re
                incomplete, so these numbers may not match your latest inputs.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            The server calculates once purchase &amp; financing, taxes and the
            revenue forecast are all complete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Assumptions({ values }: { values: FormValues }) {
  const percent = (text: string) => (text.trim() ? `${text}%` : EMPTY);
  const money = (text: string) =>
    formatCurrency(Number.isFinite(toNumber(text)) ? toNumber(text) : null);
  const total = (amounts: string[]) =>
    amounts.reduce(
      (sum, text) =>
        Number.isFinite(toNumber(text)) ? sum + toNumber(text) : sum,
      0,
    );

  const items = [
    { label: "Purchase price", value: money(values.purchase.price) },
    { label: "Down payment", value: percent(values.purchase.downPaymentPct) },
    { label: "Interest rate", value: percent(values.purchase.interestRatePct) },
    {
      label: "Loan term",
      value: values.purchase.termYears
        ? `${values.purchase.termYears} years`
        : EMPTY,
    },
    { label: "Closing costs", value: percent(values.purchase.closingCostsPct) },
    {
      label: "Setup total",
      value: formatCurrency(
        total(values.optimizationItems.map((r) => r.amount)),
      ),
    },
    {
      label: "Operating expenses",
      value: `${formatCurrency(total(values.operatingExpenses.map((r) => r.monthlyAmount)))}/mo`,
    },
    { label: "Co-hosting fee", value: percent(values.revenue.coHostingFeePct) },
    { label: "Appreciation", value: percent(values.revenue.appreciationPct) },
    {
      label: "Taxes",
      value: [
        values.taxes.landPct,
        values.taxes.slaPct,
        values.taxes.bonusPct,
        values.taxes.taxRatePct,
      ]
        .map((v) => (v.trim() ? `${v}%` : EMPTY))
        .join(" · "),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Key assumptions</h2>
        </CardTitle>
        <CardDescription>
          The inputs behind these numbers, at a glance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function SubmitPanel({
  underwritingId,
  canSubmit,
  mid,
  onBeforeSubmit,
}: {
  underwritingId: number;
  canSubmit: boolean;
  mid: string;
  onBeforeSubmit: () => void;
}) {
  const { getValues } = useFormContext<FormValues>();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    onBeforeSubmit();
    startTransition(async () => {
      // On success the action redirects to the results page.
      const result = await submitDraft(underwritingId, getValues());
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="cta"
            size="lg"
            disabled={!canSubmit || isPending}
          >
            {isPending && (
              <Loader2Icon
                className="animate-spin"
                data-icon="inline-start"
                aria-hidden
              />
            )}
            {isPending ? "Submitting…" : "Submit for grading"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for grading?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Mid revenue forecast of {mid} will be compared with the
              analyst&apos;s. You can&apos;t change this attempt afterwards, but
              you can start a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="cta" onClick={submit}>
              Submit for grading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!canSubmit && (
        <p className="text-sm text-muted-foreground">
          Fix the items in the checklist above to submit.
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
