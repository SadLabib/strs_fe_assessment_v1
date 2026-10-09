"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "type" | "value" | "onChange" | "inputMode" | "prefix"
> & {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  /** Show thousands separators while the field isn't being edited. */
  grouping?: boolean;
};

/** Keeps digits and the first decimal point: no letters, no minus sign. */
function sanitize(text: string) {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, ...decimals] = cleaned.split(".");
  return decimals.length > 0 ? `${whole}.${decimals.join("")}` : whole;
}

function groupThousands(value: string) {
  const [whole, decimals] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}

/**
 * A text input for numbers. `type="number"` is avoided on purpose: the mouse
 * wheel changes its value, it accepts "e", and it can't show separators.
 */
export function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  prefix,
  suffix,
  grouping = false,
  className,
  ref,
  ...props
}: NumberInputProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focusing swaps "675,000" for "675000", which wipes the browser's
  // select-on-focus; without this, typing would append to the old value.
  useLayoutEffect(() => {
    if (editing && grouping && inputRef.current === document.activeElement) {
      inputRef.current?.select();
    }
  }, [editing, grouping]);

  return (
    <InputGroup>
      {prefix && (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        {...props}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={grouping && !editing ? groupThousands(value) : value}
        onChange={(event) => onChange(sanitize(event.target.value))}
        onFocus={(event) => {
          setEditing(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setEditing(false);
          onBlur?.(event);
        }}
        className={cn("text-right tabular-nums", className)}
      />
      {suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
