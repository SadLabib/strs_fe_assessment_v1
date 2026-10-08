"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  SaveIcon,
} from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalysisTab } from "./analysis-tab";
import {
  combineStatuses,
  sectionStatuses,
  type SectionStatus,
} from "./completeness";
import { DealTagsTab } from "./deal-tags-tab";
import { FinancialsTab } from "./financials-tab";
import { SaveStatusIndicator } from "./save-status";
import { formSchema, type FormValues } from "./schema";
import { SummaryRail } from "./summary-rail";
import { useAutosave } from "./use-autosave";

const TABS = [
  { value: "financials", label: "Financials" },
  { value: "analysis", label: "Analysis" },
  { value: "tags", label: "Deal tags" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

type WorkspaceProps = {
  underwritingId: number;
  defaultValues: FormValues;
};

export function Workspace({ underwritingId, defaultValues }: WorkspaceProps) {
  const form = useForm<FormValues, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    // Errors appear once a field is left, then update as the trainee types.
    mode: "onTouched",
  });
  const { status, save } = useAutosave(underwritingId, form);
  const [tab, setTab] = useState<TabValue>("financials");
  const tabsRef = useRef<HTMLDivElement>(null);

  function goTo(next: TabValue) {
    setTab(next);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <FormProvider {...form}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Tabs
            ref={tabsRef}
            value={tab}
            onValueChange={(value) => setTab(value as TabValue)}
            className="scroll-mt-6 gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <WorkspaceTabsList />
              <div className="flex flex-wrap items-center gap-3">
                <SaveStatusIndicator
                  status={status}
                  onRetry={() => void save()}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={status.state === "saving"}
                >
                  <SaveIcon data-icon="inline-start" aria-hidden />
                  Save draft
                </Button>
              </div>
            </div>

            <TabsContent value="financials" className="space-y-6">
              <FinancialsTab />
              <NextButton
                label="Next: Analysis"
                onClick={() => goTo("analysis")}
              />
            </TabsContent>
            <TabsContent value="analysis" className="space-y-6">
              <AnalysisTab />
              <NextButton
                label="Next: Deal tags"
                onClick={() => goTo("tags")}
              />
            </TabsContent>
            <TabsContent value="tags">
              <DealTagsTab />
            </TabsContent>
          </Tabs>
        </form>

        <SummaryRail />
      </div>
    </FormProvider>
  );
}

const STATUS_ICONS: Record<
  SectionStatus,
  { Icon: typeof CircleCheckIcon; className: string; label: string }
> = {
  complete: {
    Icon: CircleCheckIcon,
    className: "text-success",
    label: "complete",
  },
  incomplete: {
    Icon: CircleDashedIcon,
    className: "text-muted-foreground",
    label: "incomplete",
  },
  invalid: {
    Icon: CircleAlertIcon,
    className: "text-danger",
    label: "needs attention",
  },
};

/** Its own component: it watches every value, so only the tab list re-renders. */
function WorkspaceTabsList() {
  const values = useWatch<FormValues>() as FormValues;
  const statuses = useMemo<Partial<Record<TabValue, SectionStatus>>>(() => {
    const sections = sectionStatuses(values);
    return {
      financials: combineStatuses([
        sections.purchase,
        sections.optimizationItems,
        sections.operatingExpenses,
        sections.taxes,
      ]),
      analysis: sections.revenue,
    };
  }, [values]);

  return (
    <TabsList>
      {TABS.map(({ value, label }) => {
        const status = statuses[value];
        const icon = status && STATUS_ICONS[status];
        return (
          <TabsTrigger key={value} value={value}>
            {label}
            {icon && (
              <>
                <icon.Icon
                  data-icon="inline-end"
                  className={icon.className}
                  aria-hidden
                />
                <span className="sr-only">({icon.label})</span>
              </>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

function NextButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Button type="button" onClick={onClick}>
        {label}
        <ArrowRightIcon data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  );
}
