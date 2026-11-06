"use client";

import { useState } from "react";

import { DataTable } from "@/components/primitives/data-table";
import { LineChart } from "@/components/primitives/line-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { naira } from "../marketplace/_data";
import { HOLDINGS, type Holding, PORTFOLIO_HISTORY } from "./_data";
import { HoldingCard, formatMaturity, investmentOf } from "./_holding-card";

const COLUMNS: ColumnDef<Holding>[] = [
  {
    id: "property",
    header: "Property",
    accessorFn: (holding) => investmentOf(holding).name,
    cell: ({ row }) => (
      <Link
        className="font-semibold text-foreground underline-offset-4 hover:underline"
        href={`/marketplace/${row.original.investmentId}`}
      >
        {investmentOf(row.original).name}
      </Link>
    ),
  },
  { accessorKey: "units", header: "Units" },
  {
    accessorKey: "principal",
    header: "Principal",
    cell: ({ row }) => <span className="text-foreground tabular-nums">{naira(row.original.principal)}</span>,
  },
  {
    accessorKey: "accruedYield",
    header: "Accrued yield",
    cell: ({ row }) => <span className="text-foreground tabular-nums">{naira(row.original.accruedYield)}</span>,
  },
  { accessorKey: "maturityDate", header: "Maturity", cell: ({ row }) => formatMaturity(row.original.maturityDate) },
];

const PRINCIPAL = HOLDINGS.reduce((sum, holding) => sum + holding.principal, 0);
const ACCRUED_YIELD = HOLDINGS.reduce((sum, holding) => sum + holding.accruedYield, 0);
const UNITS = HOLDINGS.reduce((sum, holding) => sum + holding.units, 0);

export function Client$InvestmentsPage() {
  const [status, setStatus] = useState("active");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("recent");
  const rows = HOLDINGS.filter((holding) => holding.status === status).toSorted((a, b) =>
    sort === "oldest" ? a.allocatedAt.localeCompare(b.allocatedAt) : b.allocatedAt.localeCompare(a.allocatedAt)
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
            <p className="mt-1 text-4xl font-light tabular-nums">{naira(PRINCIPAL + ACCRUED_YIELD)}</p>
          </div>
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">Invested principal</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{naira(PRINCIPAL)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Accrued yield</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{naira(ACCRUED_YIELD)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Property units</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{UNITS}</dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-border px-5 pt-5 pb-3">
          <LineChart
            data={PORTFOLIO_HISTORY}
            config={{ value: { label: "Portfolio value" } }}
            xAxisKey="month"
            activeKey="value"
            color="var(--chart-4)"
            showYAxis
            yAxisDomain={[4_500_000, 6_000_000]}
            yAxisTicks={[4_500_000, 5_000_000, 5_500_000, 6_000_000]}
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
            <TabsTrigger value="active">Active ({HOLDINGS.length})</TabsTrigger>
            <TabsTrigger value="matured">Matured (0)</TabsTrigger>
            <TabsTrigger value="pending">Pending (0)</TabsTrigger>
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
          {rows.map((holding, index) => (
            <HoldingCard key={holding.id} holding={holding} index={index} />
          ))}
        </div>
      )}
    </>
  );
}
