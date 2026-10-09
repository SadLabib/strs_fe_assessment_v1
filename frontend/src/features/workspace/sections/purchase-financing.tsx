"use client";

import { TriangleAlertIcon } from "lucide-react";

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
import { useLiveCalc } from "../use-live-calc";

export function PurchaseFinancing() {
  const { financing } = useLiveCalc();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Purchase &amp; financing</h2>
        </CardTitle>
        <CardDescription>
          Works out the loan, the monthly mortgage and the cash needed at
          closing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            name="purchase.price"
            label="Purchase price"
            prefix="$"
            grouping
            description="Prefilled from the listing"
          />
          <NumberField
            name="purchase.downPaymentPct"
            label="Down payment"
            suffix="%"
          />
          <NumberField
            name="purchase.interestRatePct"
            label="Interest rate"
            suffix="%"
          />
          <NumberField
            name="purchase.termYears"
            label="Loan term"
            suffix="years"
          />
          <NumberField
            name="purchase.closingCostsPct"
            label="Closing costs"
            suffix="%"
          />
        </div>

        <DerivedFacts
          emptyHint="Fill in all five fields to see the loan and the monthly mortgage."
          facts={
            financing && [
              {
                label: "Down payment",
                value: formatCurrency(financing.downPayment),
              },
              {
                label: "Closing costs",
                value: formatCurrency(financing.closingCosts),
              },
              {
                label: "Loan amount",
                value: formatCurrency(financing.loanAmount),
              },
              {
                label: "Monthly mortgage",
                value: formatCurrency(financing.monthlyPayment),
              },
            ]
          }
        />

        {financing && financing.totalOutOfPocket <= 0 && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            Total out of pocket must be more than $0. Add a down payment,
            closing costs or setup costs. This section won&apos;t be saved until
            then.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
