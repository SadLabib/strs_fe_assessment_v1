"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldPath } from "react-hook-form";

import { NumberInput } from "@/components/shared/number-input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { MAX_TEXT, type FormValues } from "./schema";

type Path = FieldPath<FormValues>;

/** "purchase.price" → "purchase-price": a safe id for label/describedby links. */
export const fieldId = (name: string) => name.replaceAll(".", "-");

type NumberFieldProps = {
  name: Path;
  label: ReactNode;
  description?: string;
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
  placeholder?: string;
  /** Visually hidden label, for compact table-like rows. */
  hideLabel?: boolean;
};

export function NumberField({
  name,
  label,
  description,
  hideLabel,
  ...input
}: NumberFieldProps) {
  const { control } = useFormContext<FormValues>();
  const id = fieldId(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            htmlFor={id}
            className={hideLabel ? "sr-only" : undefined}
          >
            {label}
          </FieldLabel>
          <NumberInput
            {...input}
            id={id}
            name={field.name}
            ref={field.ref}
            value={field.value as string}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              [description && `${id}-hint`, fieldState.invalid && `${id}-error`]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {description && (
            <FieldDescription id={`${id}-hint`}>{description}</FieldDescription>
          )}
          {fieldState.invalid && (
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
}

type TextFieldProps = {
  name: Path;
  label: string;
  placeholder?: string;
  /** Visually hidden label, for compact table-like rows. */
  hideLabel?: boolean;
};

export function TextField({
  name,
  label,
  placeholder,
  hideLabel,
}: TextFieldProps) {
  const { control } = useFormContext<FormValues>();
  const id = fieldId(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            htmlFor={id}
            className={hideLabel ? "sr-only" : undefined}
          >
            {label}
          </FieldLabel>
          <Input
            id={id}
            name={field.name}
            ref={field.ref}
            value={field.value as string}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            maxLength={MAX_TEXT}
            autoComplete="off"
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.invalid ? `${id}-error` : undefined}
          />
          {fieldState.invalid && (
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
}
