"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { MultiLineChart } from "@/components/primitives/multi-line-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AiChat02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useChat } from "../ask-ai/_chat-store";
import { MARKET_HISTORY } from "../ask-ai/_data";

const LATEST = MARKET_HISTORY.at(-1)!;
const PREVIOUS = MARKET_HISTORY.at(-2)!;
const MARKET_ROWS = [
  { id: "lagos", market: "Lagos", signal: LATEST.lagos, change: LATEST.lagos - PREVIOUS.lagos },
  { id: "abuja", market: "Abuja", signal: LATEST.abuja, change: LATEST.abuja - PREVIOUS.abuja },
];
const COLUMNS: ColumnDef<(typeof MARKET_ROWS)[number]>[] = [
  {
    accessorKey: "market",
    header: "Market",
    cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.market}</span>,
  },
  {
    accessorKey: "signal",
    header: "Indexed change",
    cell: ({ row }) => <span className="text-foreground tabular-nums">{row.original.signal}%</span>,
  },
  {
    accessorKey: "change",
    header: "Since September",
    cell: ({ row }) => <span className="text-foreground tabular-nums">+{row.original.change} pp</span>,
  },
  { id: "period", header: "Observation", cell: () => "October 2026" },
];
const METRICS = [
  {
    label: "Lagos price signal",
    value: `${LATEST.lagos}%`,
    note: `+${LATEST.lagos - PREVIOUS.lagos} pp since September`,
  },
  {
    label: "Abuja price signal",
    value: `${LATEST.abuja}%`,
    note: `+${LATEST.abuja - PREVIOUS.abuja} pp since September`,
  },
  { label: "Market spread", value: `${LATEST.lagos - LATEST.abuja} pp`, note: "Lagos relative to Abuja" },
  { label: "Observation window", value: "10 months", note: "January–October 2026" },
];
const READING_NOTES = [
  {
    title: "Observed signals",
    text: "They describe the sample series and do not predict an individual property's performance.",
  },
  {
    title: "Nov–Dec projection",
    text: "The reference forecast has an uncertainty range of ±6 percentage points. Forecasts are not plotted as observed data.",
  },
  {
    title: "Coverage",
    text: "Sparse neighbourhood coverage can bias estimates. Capital and returns are not guaranteed.",
  },
];
const BRIEFS = [
  {
    title: "Lagos leads the sample index",
    category: "Market movement",
    text: "The October Lagos signal is 4 percentage points above Abuja in the illustrative series.",
    detail:
      "The sample index moves from 15% in September to 18% in October for Lagos. Abuja moves from 11% to 14%. These are indexed price-change signals, not returns from an individual offering.",
    prompt: "Explain the Lagos and Abuja market outlook",
  },
  {
    title: "Read the trend, then the offering",
    category: "Investor guide",
    text: "A city-wide signal cannot tell you how an individual property will perform.",
    detail:
      "Review the offering's location, unit price, term, development milestones, risk disclosures and exit conditions. Broad market signals are one piece of context and do not guarantee an investment return.",
    prompt: "Compare Golden Estate and Palm Court",
  },
  {
    title: "Forecasts carry uncertainty",
    category: "About the data",
    text: "The outlook separates observations from November–December projections.",
    detail:
      "The reference forecast carries a ±6 percentage-point range, and sparse neighbourhood coverage can bias estimates. This chart shows observed sample data only. No live forecasting service is connected.",
    prompt: "Explain the market outlook forecast uncertainty",
  },
];

export default function MarketInsightsPage() {
  const [region, setRegion] = useState("all");
  const [period, setPeriod] = useState("ytd");
  const chat = useChat();
  const router = useRouter();
  const ask = (prompt: string) => {
    chat.newChat();
    chat.send(prompt);
    router.push("/dashboard/ask-ai");
  };
  const series = [
    { key: "lagos" as const, label: "Lagos · observed signal", color: "var(--chart-1)" },
    { key: "abuja" as const, label: "Abuja · observed signal", color: "var(--chart-2)" },
  ].filter((s) => region === "all" || s.key === region);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Market Insights</h1>
          <p className="text-sm/6 text-muted-foreground">
            October 2026 snapshot. Illustrative listing medians, rental observations and macroeconomic indicators, not
            live property prices or investment returns.
          </p>
        </div>
        <Button className="h-10 rounded-full px-5" onClick={() => ask("Explain the Lagos and Abuja market outlook")}>
          <HugeiconsIcon icon={AiChat02Icon} aria-hidden />
          Explore with AI
        </Button>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold">Market outlook · Lagos & Abuja</h2>
              <p className="text-xs text-muted-foreground">Indexed annual price-change signals</p>
            </div>
            <div className="flex gap-2">
              <SelectField
                id="market-region"
                value={region}
                onChange={setRegion}
                triggerAria-label="Market"
                triggerClassName="h-9! w-32 rounded-full px-3.5"
                items={[
                  { value: "all", label: "All markets" },
                  { value: "lagos", label: "Lagos" },
                  { value: "abuja", label: "Abuja" },
                ]}
              />
              <SelectField
                id="market-period"
                value={period}
                onChange={setPeriod}
                triggerAria-label="Period"
                triggerClassName="h-9! w-36 rounded-full px-3.5"
                items={[
                  { value: "ytd", label: "2026 YTD" },
                  { value: "6m", label: "Last 6 months" },
                ]}
              />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border p-5 xl:grid-cols-4 xl:divide-x xl:divide-border">
            {METRICS.map(({ label, value, note }) => (
              <div key={label} className="min-w-0 xl:pl-5 xl:first:pl-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-light tabular-nums">{value}</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-border p-5">
            <MultiLineChart
              data={period === "6m" ? MARKET_HISTORY.slice(-6) : MARKET_HISTORY}
              xAxisKey="month"
              series={series}
              yAxisDomain={[0, 20]}
              yAxisTickFormatter={(value: number) => `${value}%`}
              className="h-80"
            />
          </div>
        </Card>

        <aside className="flex min-w-0 flex-col gap-5">
          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <h2 className="text-base font-semibold">Know what you&apos;re reading</h2>
            <dl className="flex flex-col gap-4">
              {READING_NOTES.map(({ title, text }) => (
                <div key={title} className="space-y-1 border-t border-border pt-3.5">
                  <dt className="text-sm font-semibold">{title}</dt>
                  <dd className="text-xs/5 text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <section className="flex flex-col items-start gap-3 rounded-2xl bg-[#121212] p-5 text-white">
            <h2 className="text-2xl font-light">Put the numbers in context.</h2>
            <p className="text-sm/6 text-white/70">
              Ask CityCore AI to explain the sample signals and compare them with the available offerings.
            </p>
            <Button
              className="mt-1 h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/85"
              onClick={() => ask("Explain the Lagos market outlook")}
            >
              Ask about this outlook
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden />
            </Button>
          </section>
        </aside>
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold">Market watch</h2>
          <p className="text-xs text-muted-foreground">Observed sample signals, with percentage points shown as pp</p>
        </div>
        <DataTable
          columns={COLUMNS}
          data={MARKET_ROWS.filter((row) => region === "all" || row.id === region)}
          getRowId={(row) => row.id}
          showPagination={false}
          rowClassName="border-none even:[&>td]:bg-muted"
        />
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">The market, explained</h2>
        <Link href="/dashboard/marketplace" className="text-sm font-semibold underline-offset-4 hover:underline">
          View marketplace
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {BRIEFS.map((brief) => (
          <Card key={brief.title} className="gap-2 rounded-2xl px-5 py-5 ring-foreground/8">
            <p className="text-xs text-muted-foreground">{brief.category}</p>
            <h3 className="text-base font-semibold">{brief.title}</h3>
            <p className="text-sm/6 text-muted-foreground">{brief.text}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
              <Button
                variant="outline"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() =>
                  AppModal.open({
                    title: brief.title,
                    description: brief.category,
                    content: <p className="text-sm leading-relaxed">{brief.detail}</p>,
                    primaryButton: { children: "Discuss with AI", onClick: () => ask(brief.prompt) },
                    secondaryButton: { children: "Close" },
                  })
                }
              >
                Read insight
              </Button>
              <Button variant="ghost" className="h-8 rounded-full px-3 text-xs" onClick={() => ask(brief.prompt)}>
                <HugeiconsIcon icon={AiChat02Icon} aria-hidden />
                Ask AI
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
