"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { adminContentStateSchema, aiContentFormSchema, editorialFormSchema } from "@/constant/schemas/admin-content";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceDate, FinanceNumber, FinanceText } from "../_operations/treasury-ui";
import { Notice, Panel, StatusBadge } from "../_operations/ui";
import { RECOMMENDATION_AUDIT } from "../_operations/workspace-data";

type State = z.infer<typeof adminContentStateSchema>;
export function AiContentWorkspace({ value, save }: { value: State; save: (v: State) => boolean }) {
  const { submit, ready } = useReviewRequests();
  const model = useForm({ resolver: zodResolver(aiContentFormSchema), defaultValues: value.model });
  const article = useForm({ resolver: zodResolver(editorialFormSchema), defaultValues: value.article });
  const weights = useWatch({ control: model.control });
  const sum =
    (weights.locationWeight ?? 0) +
    (weights.budgetWeight ?? 0) +
    (weights.riskWeight ?? 0) +
    (weights.tenureWeight ?? 0);
  const [selected, setSelected] = React.useState(RECOMMENDATION_AUDIT[0]);
  return (
    <div className="space-y-5">
      <Panel title="Market & AI CMS" description="Separate content approval workflow · informational signals only">
        <StatusBadge value="model-draft-v0.8" />
        <form
          noValidate
          className="space-y-4"
          onSubmit={model.handleSubmit((v) =>
            AppModal.open({
              title: "Submit model-content review",
              content: (
                <Notice>
                  Weights total {sum}%. Draft v0.8 does not affect published recommendations until independently
                  approved.
                </Notice>
              ),
              primaryButton: {
                children: "Save model review request",
                onClick: () => {
                  if (
                    submit({
                      kind: "model-review",
                      subjectId: "model-0.8",
                      summary: "Model parameters v0.8",
                      reason: v.assumptions,
                      details: { ...v, baseVersion: "0.7" },
                    })
                  )
                    save({ ...value, model: v });
                },
              },
              secondaryButton: { children: "Cancel" },
            })
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FinanceNumber form={model} name="locationWeight" label="Location weight (%)" />
            <FinanceNumber form={model} name="budgetWeight" label="Budget weight (%)" />
            <FinanceNumber form={model} name="riskWeight" label="Risk preference weight (%)" />
            <FinanceNumber form={model} name="tenureWeight" label="Tenure weight (%)" />
          </div>
          <p className={`text-sm ${sum === 100 ? "text-muted-foreground" : "text-destructive"}`}>
            Weights total {sum}% / 100%
          </p>
          <FinanceNumber form={model} name="confidenceThreshold" label="Confidence threshold (0–1)" />
          <Controller
            name="uncertaintyDisclosure"
            control={model.control}
            render={({ field }) => (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Show uncertainty disclosure
                  <span className="block text-xs text-muted-foreground">Mandatory on all recommendations</span>
                </span>
                <Switch aria-label="Show uncertainty disclosure" checked={field.value} disabled />
              </label>
            )}
          />
          <FinanceText form={model} name="assumptions" label="Projection assumptions" area />
          <Button type="submit" variant="outline" disabled={!ready}>
            Submit model-content review
          </Button>
        </form>
        <Notice>
          Never label targets as promised returns. Confidence is a model assessment, not a probability of earning a
          return.
        </Notice>
      </Panel>
      <Panel title="Articles, trends & projections">
        <form
          noValidate
          className="space-y-4"
          onSubmit={article.handleSubmit((v) =>
            AppModal.open({
              title: "Request editorial approval",
              content: (
                <Notice>
                  {v.title} · reviewed {v.reviewDate}. No content will be published from this preview.
                </Notice>
              ),
              primaryButton: {
                children: "Save editorial review request",
                onClick: () => {
                  if (
                    submit({
                      kind: "editorial-review",
                      subjectId: "lekki-article-0.4",
                      summary: v.title,
                      reason: v.summary,
                      details: { ...v },
                    })
                  )
                    save({ ...value, article: v });
                },
              },
              secondaryButton: { children: "Cancel" },
            })
          )}
        >
          <FinanceText form={article} name="title" label="Article title" />
          <FinanceText form={article} name="source" label="Source / data period" />
          <FinanceText form={article} name="summary" label="Summary" area />
          <div className="grid gap-4 sm:grid-cols-2">
            <FinanceNumber form={article} name="forecastMin" label="Forecast lower range (%)" />
            <FinanceNumber form={article} name="forecastMax" label="Forecast upper range (%)" />
          </div>
          <FinanceDate form={article} name="reviewDate" label="Review date" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={article.handleSubmit((v) =>
                AppModal.open({
                  title: v.title,
                  description: v.source,
                  content: (
                    <div className="space-y-4">
                      <p className="text-sm/6">{v.summary}</p>
                      <Notice>
                        Illustrative forecast: {v.forecastMin}%–{v.forecastMax}%. Reviewed {v.reviewDate}. Estimates are
                        uncertain and are not guaranteed returns.
                      </Notice>
                    </div>
                  ),
                })
              )}
            >
              Preview article
            </Button>
            <Button type="submit" disabled={!ready}>
              Request editorial approval
            </Button>
          </div>
        </form>
        <DataTable
          showPagination={false}
          data={[
            { content: "Lekki market trend", version: "v0.4", status: "Draft" },
            { content: "Abuja rental outlook", version: "v1.2", status: "Published" },
            { content: "Price projection model note", version: "v0.8", status: "Pending review" },
          ]}
          columns={[
            { accessorKey: "content", header: "Content" },
            { accessorKey: "version", header: "Version" },
            { accessorKey: "status", header: "Status" },
          ]}
        />
      </Panel>
      <Panel title="User query & recommendation log" description="Masked queries · access restricted; read only">
        <DataTable
          data={RECOMMENDATION_AUDIT}
          showPagination={false}
          onRowClick={setSelected}
          columns={[
            { accessorKey: "investorReference", header: "Investor" },
            { accessorKey: "query", header: "Query" },
            { accessorKey: "recommendation", header: "Recommendation" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Selected {selected.id} · {selected.investorReference}
        </p>
        <Button
          variant="outline"
          onClick={() =>
            AppModal.open({
              title: `Explanation & version · ${selected.id}`,
              content: (
                <div className="space-y-4">
                  <p className="text-sm">{selected.query}</p>
                  <p className="text-sm">{selected.recommendation}</p>
                  <p className="text-sm">
                    Context: {selected.context} · model v{selected.modelVersion}
                  </p>
                  <Notice>
                    Illustrative explanation only. This view does not rerun the model or alter a historical
                    recommendation. Access must be authorized and audited by the backend.
                  </Notice>
                </div>
              ),
            })
          }
        >
          Inspect explanation & version
        </Button>
      </Panel>
    </div>
  );
}
