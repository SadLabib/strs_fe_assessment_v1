"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";

import { calculate } from "@/lib/calc/underwriting";

import { toCalcInput } from "./mappers";
import type { FormValues } from "./schema";

/**
 * The live preview: recalculates from the current inputs on every change.
 * Only components that call this re-render while the trainee types.
 */
export function useLiveCalc() {
  const values = useWatch<FormValues>() as FormValues;
  return useMemo(() => calculate(toCalcInput(values)), [values]);
}
