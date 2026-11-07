"use client";

import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { adminContentStateSchema, aiContentFormSchema, editorialFormSchema } from "@/constant/schemas/admin-content";
import { zodResolver } from "@hookform/resolvers/zod";
import { News01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FinanceDate, FinanceNumber, FinanceText } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { SegmentBar, StatusPill, type Tone, formatDate } from "../account/_ui";
import { CardHeader, type Reviews, Section } from "./_ui";

type State = z.infer<typeof adminContentStateSchema>;
const WEIGHTS = [
  { name: "locationWeight", label: "Location", color: "bg-foreground" },
  { name: "budgetWeight", label: "Budget", color: "bg-accent" },
  { name: "riskWeight", label: "Risk preference", color: "bg-foreground/40" },
  { name: "tenureWeight", label: "Tenure", color: "bg-accent/45" },
] as const;
export const LIBRARY: { content: string; version: string; status: string; tone: Tone }[] = [
  { content: "Lekki market trend", version: "v0.4", status: "Draft", tone: "muted" },
  { content: "Abuja rental outlook", version: "v1.2", status: "Published", tone: "success" },
  { content: "Price projection model note", version: "v0.8", status: "Pending review", tone: "warning" },
];

function ModelCard({ value, save, reviews }: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  const form = useForm({ resolver: zodResolver(aiContentFormSchema), defaultValues: value.model });
  const weights = useWatch({ control: form.control });
  const parts = WEIGHTS.map((w) => ({ ...w, value: Number(weights[w.name]) || 0 }));
  const sum = parts.reduce((total, p) => total + p.value, 0);

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Recommendation model" note="Draft v0.8 · live v0.7 keeps serving until approved">
          <StatusPill tone="muted">Draft v0.8</StatusPill>
        </CardHeader>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((v) =>
          AppModal.open({
            title: "Submit model for review",
            description: "Model parameters v0.8",
            content: <Notice>Live recommendations keep using v0.7 until v0.8 is independently approved.</Notice>,
            primaryButton: {
              children: "Save review request",
              onClick: () => {
                if (
                  reviews.submit({
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
        <Section step={1} title="Signal weights">
          <div className="flex flex-col gap-2.5">
            <SegmentBar
              className="h-2.5 bg-muted"
              parts={parts.map((p) => ({ key: p.name, value: p.value, className: p.color }))}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              {parts.map((p) => (
                <p key={p.name} className="flex items-center gap-1.5">
                  <span aria-hidden className={cn("size-2 rounded-full", p.color)} />
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-semibold tabular-nums">{p.value}%</span>
                </p>
              ))}
              <span
                className={cn(
                  "ml-auto font-semibold tabular-nums",
                  sum === 100 ? "text-muted-foreground" : "text-destructive"
                )}
              >
                {sum}% of 100%
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEIGHTS.map((w) => (
              <FinanceNumber key={w.name} form={form} name={w.name} label={`${w.label} (%)`} />
            ))}
          </div>
        </Section>
        <Section step={2} title="Confidence & disclosure">
          <FinanceNumber form={form} name="confidenceThreshold" label="Minimum confidence (0–1)" />
          <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <span>
              <span className="block font-semibold">Uncertainty disclosure</span>
              <span className="block text-xs text-muted-foreground">Always shown on every recommendation</span>
            </span>
            <Switch aria-label="Uncertainty disclosure" checked disabled />
          </label>
        </Section>
        <Section step={3} title="Assumptions">
          <FinanceText form={form} name="assumptions" label="Projection assumptions" area />
          <p className="text-xs/5 text-muted-foreground">
            Targets are never promised returns. Confidence is a model assessment, not a probability of earning a return.
          </p>
        </Section>
        <div className="flex justify-end border-t border-border bg-muted/40 p-5">
          <Button type="submit" className="h-10 rounded-full px-5" disabled={!reviews.ready}>
            Submit for review
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditorialCard({ value, save, reviews }: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  const form = useForm({ resolver: zodResolver(editorialFormSchema), defaultValues: value.article });
  const [min, max] = useWatch({ control: form.control, name: ["forecastMin", "forecastMax"] });

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Market insight" note="Articles, trends and projections">
        <StatusPill tone="muted">Draft v0.4</StatusPill>
      </CardHeader>
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Illustrative forecast range</p>
        <p className="mt-1 text-3xl font-light tabular-nums">
          {min ?? "–"}% – {max ?? "–"}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Estimates are uncertain and not guaranteed returns.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) =>
          AppModal.open({
            title: "Request editorial approval",
            description: v.title,
            content: <Notice>Reviewed {formatDate(v.reviewDate)}. Nothing is published from this preview.</Notice>,
            primaryButton: {
              children: "Save review request",
              onClick: () => {
                if (
                  reviews.submit({
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
        <FinanceText form={form} name="title" label="Title" />
        <FinanceText form={form} name="source" label="Source & data period" />
        <FinanceText form={form} name="summary" label="Summary" area />
        <div className="grid gap-4 sm:grid-cols-3">
          <FinanceNumber form={form} name="forecastMin" label="Low (%)" />
          <FinanceNumber form={form} name="forecastMax" label="High (%)" />
          <FinanceDate form={form} name="reviewDate" label="Reviewed" />
        </div>
        <div className="flex gap-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-full"
            onClick={form.handleSubmit((v) =>
              AppModal.open({
                title: v.title,
                description: v.source,
                content: (
                  <div className="space-y-4">
                    <p className="text-sm/6">{v.summary}</p>
                    <Notice>
                      Illustrative forecast {v.forecastMin}%–{v.forecastMax}% · reviewed {formatDate(v.reviewDate)}.
                      Estimates are uncertain and not guaranteed returns.
                    </Notice>
                  </div>
                ),
              })
            )}
          >
            Preview
          </Button>
          <Button type="submit" className="h-10 flex-1 rounded-full" disabled={!reviews.ready}>
            Request approval
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LibraryCard() {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Content library" note={`${LIBRARY.length} pieces · separate approval workflow`} />
      <ul className="flex flex-col">
        {LIBRARY.map((item) => (
          <li key={item.content} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon icon={News01Icon} aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.content}</span>
              <span className="block text-xs text-muted-foreground">{item.version}</span>
            </span>
            <StatusPill tone={item.tone}>{item.status}</StatusPill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AiContentWorkspace(props: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <ModelCard {...props} />
      <div className="flex min-w-0 flex-col gap-5">
        <EditorialCard {...props} />
        <LibraryCard />
      </div>
    </div>
  );
}
