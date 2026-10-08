"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldPath,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

import { NumberField, TextField } from "../fields";
import { MAX_ROWS, toNumber, type FormValues } from "../schema";

type LineItemsProps = {
  name: "optimizationItems" | "operatingExpenses";
  textKey: "category" | "name";
  amountKey: "amount" | "monthlyAmount";
  title: string;
  description: string;
  textLabel: string;
  amountLabel: string;
  addLabel: string;
  emptyText: string;
  suggestions: string[];
  renderTotal: (total: number) => React.ReactNode;
};

/** An editable list of name + amount rows: setup costs or operating expenses. */
function LineItems({
  name,
  textKey,
  amountKey,
  title,
  description,
  textLabel,
  amountLabel,
  addLabel,
  emptyText,
  suggestions,
  renderTotal,
}: LineItemsProps) {
  const { control } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });
  const rows = (useWatch({ control, name }) ?? []) as Record<string, string>[];

  const total = rows.reduce((sum, row) => {
    const value = toNumber(row[amountKey] ?? "");
    return Number.isFinite(value) && value > 0 ? sum + value : sum;
  }, 0);

  function addRow(label = "") {
    const amountPath = `${name}.${fields.length}.${amountKey}`;
    const textPath = `${name}.${fields.length}.${textKey}`;
    append({ [textKey]: label, [amountKey]: "" } as never, {
      focusName: label ? amountPath : textPath,
    });
  }

  const full = fields.length >= MAX_ROWS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            <div
              aria-hidden
              className="grid grid-cols-[minmax(0,1fr)_9rem_2rem] gap-2 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_11rem_2rem]"
            >
              <span>{textLabel}</span>
              <span className="text-right">{amountLabel}</span>
            </div>
            <ul className="space-y-2">
              {fields.map((field, index) => {
                const label = rows[index]?.[textKey]?.trim();
                return (
                  <li
                    key={field.id}
                    className="grid grid-cols-[minmax(0,1fr)_9rem_2rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_2rem]"
                  >
                    <TextField
                      name={
                        `${name}.${index}.${textKey}` as FieldPath<FormValues>
                      }
                      label={`${textLabel} ${index + 1}`}
                      hideLabel
                    />
                    <NumberField
                      name={
                        `${name}.${index}.${amountKey}` as FieldPath<FormValues>
                      }
                      label={`${amountLabel} ${index + 1}`}
                      hideLabel
                      prefix="$"
                      grouping
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${label || `row ${index + 1}`}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={full}
            onClick={() => addRow()}
          >
            <PlusIcon data-icon="inline-start" aria-hidden />
            {addLabel}
          </Button>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              size="xs"
              disabled={full}
              onClick={() => addRow(suggestion)}
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              {suggestion}
            </Button>
          ))}
        </div>

        <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm tabular-nums">
          {renderTotal(total)}
        </div>
      </CardContent>
    </Card>
  );
}

export function OptimizationList() {
  return (
    <LineItems
      name="optimizationItems"
      textKey="category"
      amountKey="amount"
      title="Optimization list"
      description="One-time setup costs before the first guest arrives. They add to the cash put in and to what can be depreciated."
      textLabel="Category"
      amountLabel="Amount"
      addLabel="Add item"
      emptyText="No setup costs yet. Add furniture, a hot tub or anything else bought before launch."
      suggestions={["Furniture", "Hot tub", "Game room"]}
      renderTotal={(total) => (
        <p>
          Setup total{" "}
          <span className="font-semibold">{formatCurrency(total)}</span>
        </p>
      )}
    />
  );
}

export function OperatingExpenses() {
  return (
    <LineItems
      name="operatingExpenses"
      textKey="name"
      amountKey="monthlyAmount"
      title="Operating expenses"
      description="Recurring monthly costs, taken out of revenue every year. Low and High scenarios adjust them by ×0.96 and ×1.04."
      textLabel="Expense"
      amountLabel="Per month"
      addLabel="Add expense"
      emptyText="No operating expenses yet. Most deals have utilities, internet, insurance and property tax."
      suggestions={[
        "Utilities",
        "Internet",
        "Insurance",
        "Property tax",
        "Supplies",
        "Software",
      ]}
      renderTotal={(total) => (
        <p>
          Monthly total{" "}
          <span className="font-semibold">{formatCurrency(total)}</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatCurrency(total * 12)} a year
          </span>
        </p>
      )}
    />
  );
}
