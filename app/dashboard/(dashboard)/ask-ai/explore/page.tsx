"use client";

import { type ReactNode, useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { MultiLineChart } from "@/components/primitives/multi-line-chart";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { marketQuestionFormSchema, recommendationPreferencesFormSchema } from "@/constant/schemas/insights";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";

import { fullLocation, naira } from "../../marketplace/page";
import {
  DEFAULT_PREFERENCES,
  MARKET_HISTORY,
  type Preferences,
  RECOMMENDATION_HISTORY,
  type RecommendationRecord,
  matchInvestments,
} from "../_data";

const COLUMNS: ColumnDef<RecommendationRecord>[] = [
  { accessorKey: "date", header: "Date", enableSorting: false },
  { accessorKey: "snapshot", header: "Preference snapshot", enableSorting: false },
  { accessorKey: "recommendation", header: "Top recommendation", enableSorting: false },
  { accessorKey: "outcome", header: "Outcome", enableSorting: false },
];

export default function Client$InvestWithAIPage() {
  const preferenceForm = useForm({
    resolver: zodResolver(recommendationPreferencesFormSchema),
    defaultValues: DEFAULT_PREFERENCES,
  });
  const current = useWatch({ control: preferenceForm.control });
  const draft: Preferences = {
    budget: current.budget ?? DEFAULT_PREFERENCES.budget,
    horizon: current.horizon ?? DEFAULT_PREFERENCES.horizon,
    risk: current.risk ?? DEFAULT_PREFERENCES.risk,
    location: current.location ?? DEFAULT_PREFERENCES.location,
    portfolio: current.portfolio ?? DEFAULT_PREFERENCES.portfolio,
  };
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [history, setHistory] = useState(RECOMMENDATION_HISTORY);
  const questionForm = useForm({ resolver: zodResolver(marketQuestionFormSchema), defaultValues: { question: "" } });
  const question = useWatch({ control: questionForm.control, name: "question" });
  const questionError = questionForm.formState.errors.question?.message;
  const [updated, setUpdated] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const recommendations = matchInvestments(preferences);
  const change = (key: keyof Preferences, value: string | boolean) =>
    preferenceForm.setValue(key, value, { shouldValidate: true });
  const update = preferenceForm.handleSubmit((draft) => {
    setPreferences({ ...draft });
    setUpdated(true);
    const first = matchInvestments(draft)[0];
    setHistory((current) => [
      {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString("en-GB", {
          timeZone: "Africa/Lagos",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        snapshot: `${draft.risk} · ${draft.horizon} months · ${naira(Number(draft.budget))} · ${draft.location === "all" ? "Lagos, Abuja" : draft.location}${draft.portfolio ? " · portfolio context" : ""}`,
        recommendation: first ? `${first.name} · demo match` : "No matching offerings",
        outcome: "Updated this session",
      },
      ...current,
    ]);
  });
  const ask = questionForm.handleSubmit(({ question }) => {
    AppModal.open({
      title: "Illustrative market answer",
      description: question.trim(),
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Live AI answers are not connected yet. This sample explanation is general information and is not tailored to
            your question.
          </p>
          <p>
            Review title and ownership documentation, construction milestones, rental assumptions, liquidity and exit
            terms. Development delays or weak demand can reduce returns or delay maturity. Capital is at risk.
          </p>
          <p className="text-muted-foreground">
            Use the offering prospectus and risk disclosure to assess each property independently.
          </p>
        </div>
      ),
      primaryButton: { children: "Close explanation" },
    });
  });
  return (
    <>
      <InvestmentHeading title="Invest with AI">
        Explore market signals and recommendations informed by your preferences.
      </InvestmentHeading>
      <p className="rounded-lg bg-warning/15 p-4 text-xs leading-relaxed text-warning">
        Informational only, not investment advice. AI signals can be incomplete or wrong. Capital is at risk. This
        preview uses illustrative data and local matching rules; no live AI model is connected.
      </p>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.4fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <InvestmentPanel
            title="Market outlook · Lagos & Abuja"
            description="Indexed annual price-change signals • illustrative data through October 2026"
          >
            <MultiLineChart
              data={MARKET_HISTORY}
              xAxisKey="month"
              series={[
                { key: "lagos", label: "Lagos · observed signal", color: "var(--chart-1)" },
                { key: "abuja", label: "Abuja · observed signal", color: "var(--chart-2)" },
              ]}
              yAxisTickFormatter={(value: number) => `${value}%`}
              yAxisDomain={[0, 20]}
              className="h-72"
            />
            <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-primary">
              Sources: illustrative listing medians, rental observations and macroeconomic indicators. Sample review: 20
              Oct 2026. Sparse neighbourhood coverage can bias estimates.
            </p>
          </InvestmentPanel>
          <InvestmentPanel
            title="Recommended for your preferences"
            description={`${preferences.risk} risk • ${preferences.horizon}-month horizon • budget up to ${naira(Number(preferences.budget))}`}
          >
            {updated && (
              <p role="status" className="text-xs text-muted-foreground">
                Demo matches updated. Changes and history are kept for this session only.
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              {recommendations.map((investment, index) => (
                <article key={investment.id} className="flex flex-col gap-5">
                  <h2 className="font-semibold">{investment.name}</h2>
                  <Badge variant="secondary" className="self-start">
                    Illustrative preference match
                  </Badge>
                  <p className="text-xs leading-relaxed">
                    Matches your {preferences.location === "all" ? "Lagos or Abuja" : preferences.location} preference
                    at {naira(investment.unitPrice)} per unit. The {investment.tenureMonths}-month term fits your
                    selected horizon.
                    {preferences.portfolio && " Existing holdings are used to prioritize other properties."}
                  </p>
                  <InvestmentFacts
                    rows={[
                      ["Target simple annual ROI", `${investment.targetRoi}%`],
                      ["Location", fullLocation(investment)],
                      ["Key uncertainty", "Development timeline and rental demand"],
                    ]}
                  />
                  <Button
                    variant={index === 0 ? "default" : "secondary"}
                    className="mt-auto self-start rounded-full px-4 text-xs"
                    render={<Link href={`/marketplace/${investment.id}`} />}
                    nativeButton={false}
                  >
                    Review prospectus →
                  </Button>
                </article>
              ))}
            </div>
            {recommendations.length === 0 && (
              <p role="status" className="rounded-lg bg-muted p-4 text-sm">
                No offerings match these preferences. Try a larger budget, longer horizon or another location.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Rankings do not imply suitability or assured performance. Review the underlying documents independently.
            </p>
          </InvestmentPanel>
        </div>
        <aside className="flex min-w-0 flex-col gap-5">
          <InvestmentPanel title="Your preferences" description="Update inputs to refine suggestions">
            <SelectField
              id="ai-budget"
              label="Budget"
              value={draft.budget}
              onChange={(value) => change("budget", value)}
              items={[75000, 100000, 300000, 500000, 1000000].map((value) => ({
                value: String(value),
                label: `Up to ${naira(value)}`,
              }))}
            />
            <SelectField
              id="ai-horizon"
              label="Investment horizon"
              value={draft.horizon}
              onChange={(value) => change("horizon", value)}
              items={[
                { value: "12", label: "12 months" },
                { value: "18", label: "18 months" },
              ]}
            />
            <SelectField
              id="ai-risk"
              label="Risk appetite"
              value={draft.risk}
              onChange={(value) => change("risk", value)}
              items={[
                { value: "conservative", label: "Conservative" },
                { value: "balanced", label: "Balanced" },
                { value: "growth", label: "Growth" },
              ]}
            />
            <SelectField
              id="ai-location"
              label="Preferred locations"
              value={draft.location}
              onChange={(value) => change("location", value)}
              items={[
                { value: "all", label: "Lagos, Abuja" },
                { value: "Lagos", label: "Lagos" },
                { value: "Abuja", label: "Abuja" },
              ]}
            />
            <label className="flex items-center justify-between gap-4 text-xs">
              <span>
                <span className="block font-medium">Use portfolio context</span>
                <span className="mt-1 block text-muted-foreground">Include existing holdings</span>
              </span>
              <Switch checked={draft.portfolio} onCheckedChange={(value) => change("portfolio", value)} />
            </label>
            <Button className="h-9 w-full rounded-full text-xs" onClick={update}>
              Update recommendations
            </Button>
          </InvestmentPanel>
          <InvestmentPanel title="Ask about the market">
            <TextField
              id="ai-question"
              label="Your question"
              value={question}
              onChange={(value) => {
                questionForm.setValue("question", value, { shouldValidate: true });
              }}
              placeholder="What are the key risks in Lekki?"
              maxLength={500}
              error={questionError}
            />
            <Button variant="secondary" className="w-full rounded-full text-xs" onClick={ask}>
              Explore an answer
            </Button>
            <p className="text-[11px] text-muted-foreground">Do not share personal or financial identifiers.</p>
          </InvestmentPanel>
        </aside>
      </div>
      <InvestmentPanel
        title="Recommendation history"
        description="Illustrative explanations and the preference snapshot used at the time"
      >
        <DataTable
          columns={COLUMNS}
          data={savedOnly ? history.filter((record) => record.outcome === "Saved") : history}
          showPagination={false}
          getRowId={(row) => row.id}
        />
        <Button
          variant="secondary"
          className="self-start rounded-full px-5 text-xs"
          onClick={() => setSavedOnly((current) => !current)}
        >
          {savedOnly ? "View all explanations" : "View saved explanations"}
        </Button>
      </InvestmentPanel>
    </>
  );
}

function InvestmentPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="border ring-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function InvestmentHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

function InvestmentFacts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3 text-xs text-primary">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <dt>{label}</dt>
          <span aria-hidden>·</span>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
