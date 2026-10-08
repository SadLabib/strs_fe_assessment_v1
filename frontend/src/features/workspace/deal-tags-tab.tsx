"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { DealTag } from "@/lib/domain";

import type { FormValues } from "./schema";

const GROUPS: { title: string; tags: [DealTag, string][] }[] = [
  {
    title: "Property",
    tags: [
      ["turnkey", "Turnkey"],
      ["furnished", "Furnished"],
      ["luxury", "Luxury"],
      ["new_construction", "New construction"],
      ["existing_airbnb", "Existing Airbnb"],
      ["waterfront", "Waterfront"],
      ["remote", "Remote"],
      ["add_inground_pool", "Add in-ground pool"],
    ],
  },
  {
    title: "Financial profile",
    tags: [
      ["tax_efficient", "Tax efficient"],
      ["arv", "ARV"],
      ["high_cash_on_cash", "High Cash-on-Cash"],
      ["low_cash_on_cash", "Low Cash-on-Cash"],
    ],
  },
  {
    title: "Operations",
    tags: [["can_support_cohost", "Can support co-host"]],
  },
];

/** Yes/no labels that describe the deal at a glance. They don't affect the score. */
export function DealTagsTab() {
  const { control } = useFormContext<FormValues>();
  const tags = useWatch({ control, name: "tags" });
  const selected = Object.values(tags ?? {}).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Deal tags</h2>
        </CardTitle>
        <CardDescription>
          Yes/no labels that describe the deal at a glance. They don&apos;t
          affect your score.{" "}
          <span className="font-medium text-foreground tabular-nums">
            {selected} selected
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {GROUPS.map((group) => (
          <fieldset key={group.title} className="space-y-3">
            <legend className="text-sm font-semibold">{group.title}</legend>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tags.map(([tag, label]) => (
                <Controller
                  key={tag}
                  name={`tags.${tag}`}
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Switch
                        id={`tag-${tag}`}
                        name={field.name}
                        ref={field.ref}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                      <FieldLabel
                        htmlFor={`tag-${tag}`}
                        className="font-normal"
                      >
                        {label}
                      </FieldLabel>
                    </Field>
                  )}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </CardContent>
    </Card>
  );
}
