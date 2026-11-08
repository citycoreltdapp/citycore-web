"use client";

import { useState } from "react";

import { DataTable } from "@/components/primitives/data-table";
import { LineChart } from "@/components/primitives/line-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";

import { HOME_DASHBOARD, portfolioSeries } from "../_data";
import { naira } from "../marketplace/page";
import { HOLDINGS, type Holding, accruedYield, monthsElapsed, payoutAtMaturity, progress } from "./_data";

const maturityLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", month: "short", year: "numeric" });

const ACTIVE = HOLDINGS.filter((item) => item.status === "active");
const MATURED = HOLDINGS.filter((item) => item.status === "matured");
const invested = ACTIVE.reduce((sum, item) => sum + item.amountInvested, 0);
const earned = ACTIVE.reduce((sum, item) => sum + accruedYield(item), 0);
const atMaturity = ACTIVE.reduce((sum, item) => sum + payoutAtMaturity(item), 0);
const HISTORY = portfolioSeries(HOME_DASHBOARD, "oneYear");

function HoldingCard({ item, index }: { item: Holding; index: number }) {
  const { property } = item;
  const matured = item.status === "matured";

  return (
    <Card
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative animate-in gap-0 rounded-2xl px-1.5 py-1.5 ring-foreground/8 transition-[box-shadow,translate] duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:shadow-lg hover:ring-foreground/15 motion-safe:hover:-translate-y-0.5 motion-reduce:animate-none"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-[0.625rem] bg-muted">
        <Image
          src={property.images[0] ?? ""}
          alt=""
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/80 via-black/35 to-transparent" />
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white capitalize backdrop-blur-sm">
          <span
            aria-hidden
            className={matured ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-accent"}
          />
          {item.status}
        </span>
        <span
          aria-hidden
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
        </span>
        <p className="absolute right-3 bottom-2.5 left-3 text-white">
          <span className="block text-xs text-white/80">Current value</span>
          <span className="text-3xl font-light tabular-nums">{naira(item.amountInvested + accruedYield(item))}</span>
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-2.5 pt-3.5 pb-2.5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            <Link
              href={`/marketplace/${property.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {property.name}
            </Link>
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-3.5 shrink-0" />
            {item.units} {item.units === 1 ? "unit" : "units"} · {property.city}
          </p>
        </div>
        <dl className="mt-auto grid grid-cols-2 border-t border-border pt-3.5">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Invested</dt>
            <dd className="text-sm font-semibold tabular-nums">{naira(item.amountInvested)}</dd>
          </div>
          <div className="space-y-0.5 text-right">
            <dt className="text-xs text-muted-foreground">{matured ? "Returned" : "Yield so far"}</dt>
            <dd className="text-sm font-semibold text-success tabular-nums">+{naira(accruedYield(item))}</dd>
          </div>
        </dl>
        <div className="space-y-2">
          <Progress
            aria-label={`${property.name} tenure`}
            value={progress(item) * 100}
            className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-accent"
          />
          <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>
              {matured
                ? `Paid out ${naira(payoutAtMaturity(item))}`
                : `Month ${monthsElapsed(item)} of ${property.tenureMonths}`}
            </span>
            <span>
              {matured ? "Matured" : "Matures"} {maturityLabel(item.maturityDate)}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

const COLUMNS: ColumnDef<Holding>[] = [
  {
    id: "property",
    header: "Property",
    accessorFn: (item) => item.property.name,
    cell: ({ row }) => (
      <Link
        className="font-semibold text-foreground underline-offset-4 hover:underline"
        href={`/marketplace/${row.original.property.id}`}
      >
        {row.original.property.name}
      </Link>
    ),
  },
  { accessorKey: "units", header: "Units" },
  {
    accessorKey: "amountInvested",
    header: "Invested",
    cell: ({ row }) => <span className="text-foreground tabular-nums">{naira(row.original.amountInvested)}</span>,
  },
  {
    id: "accruedYield",
    header: "Yield so far",
    cell: ({ row }) => <span className="text-success tabular-nums">+{naira(accruedYield(row.original))}</span>,
  },
  {
    accessorKey: "maturityDate",
    header: "Maturity",
    cell: ({ row }) => maturityLabel(row.original.maturityDate),
  },
];

export default function InvestmentsPage() {
  const [status, setStatus] = useState("active");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("recent");
  const rows = (status === "matured" ? MATURED : ACTIVE).toSorted((a, b) =>
    sort === "oldest" ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate)
  );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">My Investments</h1>
          <p className="text-sm/6 text-muted-foreground">
            Illustrative holdings and sample history. Target returns are projections, not a guarantee. Capital is at
            risk.
          </p>
        </div>
        <Button className="h-10 rounded-full px-5" render={<Link href="/ask-ai/explore" />} nativeButton={false}>
          Invest with AI
        </Button>
      </header>

      <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 p-5">
          <div>
            <p className="text-xs text-muted-foreground">Current value</p>
            <p className="mt-1 text-4xl font-light tabular-nums">{naira(invested + earned)}</p>
          </div>
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">Invested</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{naira(invested)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Yield earned</dt>
              <dd className="mt-0.5 text-sm font-semibold text-success tabular-nums">+{naira(earned)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">At maturity</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{naira(atMaturity)}</dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-border px-5 pt-5 pb-3">
          <LineChart
            data={HISTORY}
            config={{ value: { label: "Portfolio value" } }}
            xAxisKey="period"
            activeKey="value"
            color="var(--chart-4)"
            showYAxis
            yAxisDomain={[0, 6_000_000]}
            yAxisTicks={[0, 2_000_000, 4_000_000, 6_000_000]}
            yAxisTickFormatter={(value: number) => `₦${(value / 1_000_000).toFixed(1)}m`}
            tooltipFormatter={(value) => naira(Number(value))}
            gradientOpacity={0.45}
            className="h-72"
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList aria-label="Investment status">
            <TabsTrigger value="active">Active · {ACTIVE.length}</TabsTrigger>
            <TabsTrigger value="matured">Matured · {MATURED.length}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-3">
          <SelectField
            id="portfolio-sort"
            value={sort}
            onChange={setSort}
            triggerAria-label="Sort by"
            triggerClassName="h-9! w-36 rounded-full bg-card px-3.5"
            items={[
              { value: "recent", label: "Recent" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
          <Tabs value={view} onValueChange={setView}>
            <TabsList aria-label="Portfolio view">
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="items-center gap-3 rounded-2xl p-10 text-center ring-foreground/8">
          <h2 className="font-semibold">No {status} investments</h2>
          <p className="text-sm text-muted-foreground">Your {status} investments will appear here.</p>
          <Button
            variant="secondary"
            className="rounded-full px-5"
            render={<Link href="/marketplace" />}
            nativeButton={false}
          >
            Explore marketplace
          </Button>
        </Card>
      ) : view === "list" ? (
        <Card className="rounded-2xl px-5 ring-foreground/8">
          <DataTable
            columns={COLUMNS}
            data={rows}
            showPagination={false}
            getRowId={(row) => row.id}
            rowClassName="border-none even:[&>td]:bg-muted"
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((item, index) => (
            <HoldingCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </>
  );
}
