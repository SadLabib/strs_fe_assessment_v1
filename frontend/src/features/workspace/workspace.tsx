"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, SaveIcon } from "lucide-react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalysisTab } from "./analysis-tab";
import {
  combineStatuses,
  sectionStatuses,
  SECTIONS,
  type Section,
  type SectionStatus,
} from "./completeness";
import { DealTagsTab } from "./deal-tags-tab";
import { FinancialsTab } from "./financials-tab";
import { ReviewTab } from "./review-tab";
import { SaveStatusIndicator } from "./save-status";
import { formSchema, type FormValues } from "./schema";
import { SectionStatusIcon } from "./section-status-icon";
import { SummaryRail } from "./summary-rail";
import { useAutosave } from "./use-autosave";

const TABS = [
  { value: "financials", label: "Financials" },
  { value: "analysis", label: "Analysis" },
  { value: "tags", label: "Deal tags" },
  { value: "review", label: "Review" },
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
  const { status, confirmed, save, cancel } = useAutosave(underwritingId, form);
  const [tab, setTab] = useState<TabValue>("financials");
  const tabsRef = useRef<HTMLDivElement>(null);

  function changeTab(next: TabValue) {
    setTab(next);
    // Review shows the server's numbers, so make sure they're current.
    if (next === "review") void save();
  }

  function goTo(next: TabValue) {
    changeTab(next);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** From the review checklist: open the field's tab, show its error and focus it. */
  function goToField(path: FieldPath<FormValues>) {
    const section = path.split(".")[0] as Section;
    setTab(SECTIONS[section].tab);
    // The tab's fields mount on this render; focus them on the next frame.
    requestAnimationFrame(() => {
      void form.trigger(path);
      form.setFocus(path, { shouldSelect: true });
    });
  }

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
            onValueChange={(value) => changeTab(value as TabValue)}
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
            <TabsContent value="tags" className="space-y-6">
              <DealTagsTab />
              <NextButton label="Next: Review" onClick={() => goTo("review")} />
            </TabsContent>
            <TabsContent value="review">
              <ReviewTab
                underwritingId={underwritingId}
                confirmed={confirmed}
                isSaving={status.state === "saving"}
                onGoToField={goToField}
                onBeforeSubmit={cancel}
              />
            </TabsContent>
          </Tabs>
        </form>

        <SummaryRail />
      </div>
    </FormProvider>
  );
}

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
        return (
          <TabsTrigger key={value} value={value}>
            {label}
            {status && (
              <SectionStatusIcon status={status} data-icon="inline-end" />
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
