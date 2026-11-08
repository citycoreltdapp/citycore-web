"use client";

import * as React from "react";

import { CardMenu } from "@/components/dashboard/card-menu";
import { ComposedChart, type ComposedChartSeries } from "@/components/primitives/composed-chart";
import { DataTable } from "@/components/primitives/data-table";
import { MultiAreaChart } from "@/components/primitives/multi-area-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminRange, type AdminStatTone } from "@/constant/schemas/admin";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowRight02Icon,
  ArrowUp02Icon,
  ChartColumnIcon,
  ChartLineData02Icon,
  Coins01Icon,
  PieChart01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { toast } from "sonner";

import {
  ADMIN_STATS,
  HOME_COUNTRY,
  INCOME_AND_EXPENSES,
  LATEST_TRANSACTIONS,
  RANGES,
  TRANSACTION_OVERVIEW,
  USERS_BY_COUNTRY,
} from "./_data";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500.9;
const MILLER_TOP = 2.001618;
const miller = (latitude: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + (0.4 * latitude * Math.PI) / 180));
const project = (latitude: number, longitude: number) => ({
  x: Number((((longitude + 180) / 360) * MAP_WIDTH).toFixed(1)),
  y: Number(((MILLER_TOP - miller(latitude)) * (MAP_WIDTH / (2 * Math.PI))).toFixed(1)),
});

const MAP_IMAGE = "url(/assets/images/admin/world-map.svg)";
const home = project(HOME_COUNTRY.latitude, HOME_COUNTRY.longitude);

function Pin({ country, users, latitude, longitude }: (typeof USERS_BY_COUNTRY)[number]) {
  const { x, y } = project(latitude, longitude);

  return (
    <g>
      <title>{`${country}: ${users.toLocaleString("en-NG")} users`}</title>
      <circle
        cx={x}
        cy={y}
        r={8}
        className="origin-center animate-ping fill-foreground/25 [animation-duration:2.4s] [transform-box:fill-box] motion-reduce:animate-none"
      />
      <circle cx={x} cy={y} r={8} className="fill-foreground stroke-card stroke-[3]" />
    </g>
  );
}

function UsersMap() {
  return (
    <figure aria-label="Users by country" className="relative w-full" style={{ aspectRatio: MAP_WIDTH / MAP_HEIGHT }}>
      <div
        aria-hidden
        className="absolute inset-0 bg-muted-foreground/35"
        style={{ maskImage: MAP_IMAGE, WebkitMaskImage: MAP_IMAGE, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
      <svg aria-hidden viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 size-full">
        {USERS_BY_COUNTRY.map(({ code, latitude, longitude }) => {
          const { x, y } = project(latitude, longitude);
          return (
            <line
              key={code}
              x1={home.x}
              y1={home.y}
              x2={x}
              y2={y}
              strokeDasharray="4 5"
              className="stroke-foreground/45 stroke-[1.25]"
            />
          );
        })}
        {USERS_BY_COUNTRY.map((country) => (
          <Pin key={country.code} {...country} />
        ))}
        <Pin {...HOME_COUNTRY} />
      </svg>
      <figcaption className="sr-only">
        <ul>
          {[HOME_COUNTRY, ...USERS_BY_COUNTRY].map(({ code, country, users }) => (
            <li key={code}>
              {country}: {users.toLocaleString("en-NG")} users
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

const STAT_MENU_ITEMS = ["Print data", "Reset data", "Download data"];
const TABLE_MENU_ITEMS = ["Print", "Remove", "Download"];
const STAT_ICONS: IconSvgElement[] = [ChartColumnIcon, Coins01Icon, PieChart01Icon, ChartLineData02Icon];
const TONE_STYLES: Record<AdminStatTone, string> = {
  neutral: "text-muted-foreground",
  warning: "text-warning",
  info: "text-chart-2",
  negative: "text-destructive",
};

const OVERVIEW_SERIES: ComposedChartSeries<(typeof TRANSACTION_OVERVIEW)[number]>[] = [
  { key: "volume", label: "Transactions", type: "bar", color: "var(--chart-1)" },
  { key: "trend", label: "Trend", type: "area", color: "var(--chart-3)" },
  { key: "average", label: "Average", type: "line", color: "var(--chart-2)", dashed: true },
];
const INCOME_SERIES = [
  { key: "income", label: "Income", color: "var(--chart-1)", fillColor: "var(--chart-5)", fillOpacity: 0.08 },
  { key: "expenses", label: "Expenses", color: "var(--chart-3)" },
] as const;

const TRANSACTION_COLUMNS: ColumnDef<(typeof LATEST_TRANSACTIONS)[number], unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground">{row.original.title}</span>
        <span className="text-xs">{row.original.date}</span>
      </div>
    ),
  },
  { accessorKey: "medium", header: "Medium", enableSorting: false },
  { accessorKey: "amount", header: "Transaction", enableSorting: false },
];

const scaleOf = (range: AdminRange) => RANGES.find((option) => option.value === range)?.scale ?? 1;

function RangeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: AdminRange;
  onChange: (range: AdminRange) => void;
}) {
  return (
    <SelectField
      id={id}
      label="Sort By :"
      value={value}
      onChange={(next) => onChange(next as AdminRange)}
      items={RANGES}
      className="flex-row items-center"
      labelClassName="font-normal whitespace-nowrap text-muted-foreground"
      triggerClassName="w-32 rounded-lg bg-muted/50"
      triggerSize="sm"
    />
  );
}

function ChartCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 ring-0", className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed px-5 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">{children}</CardContent>
    </Card>
  );
}

export default function Client$AdminDashboardPage() {
  const isMobile = useIsMobile();
  const [overviewRange, setOverviewRange] = React.useState<AdminRange>("15d");
  const [incomeRange, setIncomeRange] = React.useState<AdminRange>("15d");

  const overviewRows = TRANSACTION_OVERVIEW.map((row) => ({
    ...row,
    volume: Math.round(row.volume * scaleOf(overviewRange)),
    trend: Math.round(row.trend * scaleOf(overviewRange)),
  }));
  const incomeRows = INCOME_AND_EXPENSES.map((row) => ({
    ...row,
    income: Math.round(row.income * scaleOf(incomeRange)),
    expenses: Math.round(row.expenses * scaleOf(incomeRange)),
  }));

  return (
    <>
      <h1 className="sr-only">Admin dashboard</h1>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {ADMIN_STATS.map(({ title, amount, change, tone }, index) => (
          <Card key={title} className="ring-0">
            <CardHeader className="flex items-center justify-between border-b border-dashed px-5 pb-3">
              <CardTitle className="font-normal">{title}</CardTitle>
              <CardMenu label={title} items={STAT_MENU_ITEMS} />
            </CardHeader>
            <CardContent className="flex items-center gap-3 px-5 pb-1">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                <HugeiconsIcon icon={STAT_ICONS[index]} aria-hidden className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-xl font-semibold tracking-tight">{amount}</p>
                <p className={cn("flex items-center gap-1 text-sm tabular-nums", TONE_STYLES[tone])}>
                  <HugeiconsIcon icon={ArrowUp02Icon} aria-hidden className="size-4" />
                  {change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Transaction Overview"
          action={<RangeSelect id="overview-range" value={overviewRange} onChange={setOverviewRange} />}
        >
          <ComposedChart
            data={overviewRows}
            xAxisKey="month"
            series={OVERVIEW_SERIES}
            barSize={isMobile ? 8 : 12}
            xAxisInterval={isMobile ? 1 : 0}
            yAxisDomain={[0, 120]}
            yAxisTicks={[0, 30, 60, 90, 120]}
            gridStrokeDasharray="4 4"
          />
        </ChartCard>

        <ChartCard
          title="Income and Expenses"
          action={<RangeSelect id="income-range" value={incomeRange} onChange={setIncomeRange} />}
        >
          <MultiAreaChart
            data={incomeRows}
            xAxisKey="week"
            series={[...INCOME_SERIES]}
            xAxisInterval={isMobile ? 2 : 0}
            xAxisFormatter={(week) => String(week)}
            yAxisDomain={[160, 560]}
            yAxisTicks={[160, 240, 320, 400, 480, 560]}
            yAxisTickFormatter={(value: number) => `${value}k`}
            gridStrokeDasharray="4 4"
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Latest Transaction" action={<CardMenu label="Latest Transaction" items={TABLE_MENU_ITEMS} />}>
          <React.Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <DataTable
              columns={TRANSACTION_COLUMNS}
              data={LATEST_TRANSACTIONS}
              getRowId={(row) => row.id}
              rowClassName="border-none even:bg-muted/60 hover:bg-muted/60"
              showPagination={false}
            />
          </React.Suspense>
          <button
            type="button"
            className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-chart-4 hover:underline"
            onClick={() => toast.info("The full transactions page isn't built yet.")}
          >
            See More
            <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden className="size-4" />
          </button>
        </ChartCard>

        <ChartCard
          title="Live Users By Country"
          action={<CardMenu label="Live Users By Country" items={TABLE_MENU_ITEMS} />}
          className="justify-start"
        >
          <UsersMap />
        </ChartCard>
      </div>
    </>
  );
}
