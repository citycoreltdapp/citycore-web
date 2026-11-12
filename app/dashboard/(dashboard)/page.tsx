"use client";

import * as React from "react";
import { Suspense } from "react";

import { useCurrentUser } from "@/actions/auth";
import { CardMenu } from "@/components/dashboard/card-menu";
import { DataTable } from "@/components/primitives/data-table";
import { LineChart } from "@/components/primitives/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { homeDashboardSchema } from "@/constant/schemas/dashboard";
import { walletSchema } from "@/constant/schemas/finance";
import { useMockQuery } from "@/lib/query";
import { AddCircleIcon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { CompanyProfileCard, CorporateBanner, greeting } from "./_corporate-home";
import { CHART_RANGES, type ChartRange, HOME_DASHBOARD, portfolioSeries, totalBalance } from "./_data";
import { naira } from "./marketplace/page";
import { type Transaction } from "./transactions/_data";
import { TRANSACTION_COLUMNS } from "./transactions/_transaction-ui";
import { type BankAccount, WALLET, maskedAccount } from "./wallet/_data";

const CHART_CONFIG = { value: { label: "Portfolio value" } } satisfies ChartConfig;
const STEPS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

function axisTicks(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = STEPS.find((candidate) => (max - min) / candidate <= 4) ?? STEPS.at(-1)!;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round((end - start) / step) + 1 }, (_, index) => start + index * step);
}

function AssetsCard() {
  const { data: dashboard } = useMockQuery({
    key: "dashboard",
    schema: homeDashboardSchema,
    mock: HOME_DASHBOARD,
  });
  const [range, setRange] = React.useState<ChartRange>("oneYear");
  if (!dashboard) return null;
  const data = portfolioSeries(dashboard, range);
  const first = data[0]?.value ?? 0;
  const last = data.at(-1)?.value ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;
  const ticks = axisTicks(data.map((point) => point.value));

  return (
    <Card className="ring-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed px-5 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Portfolio value</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {naira(dashboard.portfolioValue)}
            <span className={change >= 0 ? "ml-2 text-success" : "ml-2 text-destructive"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </p>
        </div>
        <Tabs value={range} onValueChange={(next) => setRange(next as ChartRange)}>
          <TabsList aria-label="Time range" className="gap-1 bg-transparent p-0">
            {CHART_RANGES.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="h-7 rounded-sm bg-muted px-3 text-xs data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-5">
        <LineChart
          data={data}
          config={CHART_CONFIG}
          xAxisKey="period"
          activeKey="value"
          color="var(--chart-4)"
          className="h-72"
          showYAxis
          yAxisDomain={[ticks[0], ticks.at(-1)!]}
          yAxisTicks={ticks}
          yAxisTickFormatter={(value: number) => `₦${(value / 1_000_000).toFixed(1)}m`}
          tooltipFormatter={(value) => naira(Number(value))}
          gradientOpacity={0.45}
        />
      </CardContent>
    </Card>
  );
}

const TABLE_MENU_ITEMS = ["Print", "Remove", "Download"];

const RECENT_COLUMNS: ColumnDef<Transaction, unknown>[] = [
  TRANSACTION_COLUMNS.title,
  TRANSACTION_COLUMNS.amount,
  TRANSACTION_COLUMNS.status,
];

type WalletAccount = BankAccount & { id: string; role: string };

const ACCOUNT_COLUMNS: ColumnDef<WalletAccount, unknown>[] = [
  {
    accessorKey: "bankName",
    header: "Bank",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground">{row.original.bankName}</span>
        <span className="text-xs">{row.original.accountName}</span>
      </div>
    ),
  },
  {
    id: "account",
    header: "Account",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground tabular-nums">{maskedAccount(row.original)}</span>
        <span className="text-xs">{row.original.role}</span>
      </div>
    ),
  },
];

function TableCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 ring-0">
      <CardHeader className="flex items-center justify-between border-b border-dashed px-5 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardMenu label={title} items={TABLE_MENU_ITEMS} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        {children}
        <Link href={href} className="flex w-fit items-center gap-2 text-sm font-medium text-chart-4 hover:underline">
          See More
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

const ZEBRA_ROWS = "border-none even:bg-muted/60 hover:bg-muted/60";

function TransactionTables() {
  const { data: dashboard } = useMockQuery({
    key: "dashboard",
    schema: homeDashboardSchema,
    mock: HOME_DASHBOARD,
  });
  const { data: wallet } = useMockQuery({ key: "wallet", schema: walletSchema, mock: WALLET });
  const accounts: WalletAccount[] = wallet
    ? [
        ...(wallet.fundingAccount ? [{ id: "funding", role: "Funding account", ...wallet.fundingAccount }] : []),
        ...(wallet.payoutAccount ? [{ id: "payout", role: "Payout account", ...wallet.payoutAccount }] : []),
      ]
    : [];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TableCard title="Recent transactions" href="/dashboard/transactions">
        <DataTable
          columns={RECENT_COLUMNS}
          data={dashboard?.recentTransactions ?? []}
          getRowId={(row) => row.id}
          rowClassName={ZEBRA_ROWS}
          showPagination={false}
        />
      </TableCard>

      <TableCard title="Wallet accounts" href="/dashboard/wallet">
        <DataTable
          columns={ACCOUNT_COLUMNS}
          data={accounts}
          getRowId={(row) => row.id}
          rowClassName={ZEBRA_ROWS}
          showPagination={false}
        />
      </TableCard>
    </div>
  );
}

const COPPER = "#D0A07C";
const CREAM = "#F1D7BF";
const SAND = "#BFAF9F";
const CLAY = "#B87643";
const ROSE = "#C29575";
const TAUPE = "#9C7C66";
const UMBER = "#6C635A";

function BannerArt() {
  return (
    <svg viewBox="0 0 185 155" aria-hidden className="absolute right-0 bottom-0 hidden h-full lg:block">
      <path d="M150 18a28 13 0 0 1 28-13v13z" fill={CLAY} />
      <path d="M138 38c0-10 4-18 12-20 2 10-3 18-12 20z" fill={TAUPE} />
      <path d="M150 45a28 26 0 0 1 28-26v26z" fill={COPPER} />
      <path d="M116 61a17 14 0 0 1 34 0v14h-17a17 14 0 0 1-17-14z" fill={COPPER} />
      <circle cx="141" cy="67" r="8" fill={CREAM} />
      <path d="M150 75a28 28 0 0 1 28-28v28z" fill={CLAY} />
      <path d="M165 75a13 15 0 0 1 13-15v15z" fill={SAND} />
      <path d="M116 75h34v37a34 37 0 0 1-34-37z" fill={SAND} />
      <path d="M150 75h28v30a28 30 0 0 1-28-30z" fill={ROSE} />
      <circle cx="115" cy="98" r="10.5" fill={COPPER} />
      <circle cx="115" cy="98" r="5" fill={CREAM} />
      <path d="M32 112h18a30 20 0 0 1 30 20H52a20 20 0 0 1-20-20z" fill={TAUPE} />
      <path d="M56 123h12a12 9 0 0 1 12 9H68a12 9 0 0 1-12-9z" fill={CLAY} />
      <path d="M80 118h12a23 13 0 0 1 23 13h-12a23 13 0 0 1-23-13z" fill={CLAY} />
      <path d="M115 152v-12a35 35 0 0 1 35-35v12a35 35 0 0 1-35 35z" fill={CLAY} />
      <path d="M133 136v-11a17 17 0 0 1 17-17v11a17 17 0 0 1-17 17z" fill={UMBER} />
      <circle cx="166" cy="120" r="14" fill={COPPER} />
      <circle cx="166" cy="120" r="8" fill={UMBER} />
      <path d="M5 152a20 22 0 0 1 20-22h20v22z" fill={CLAY} />
      <path d="M28 130h17v14a17 14 0 0 1-17-14z" fill={SAND} />
      <path d="M45 130h35a17 22 0 0 1-17 22H45z" fill={ROSE} />
      <path d="M82 152a16.5 16.5 0 0 1 33 0h-8a8.5 8.5 0 0 0-17 0z" fill={COPPER} />
      <path d="M90 152a8.5 8.5 0 0 1 17 0z" fill={UMBER} />
      <path d="M150 135h28v17h-28z" fill={COPPER} />
      <path d="M160 152a18 17 0 0 1 18-17v17z" fill={CREAM} />
    </svg>
  );
}

function WelcomeBanner() {
  const { data: user } = useCurrentUser();

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#121212] p-6 text-white md:p-8">
      <div className="relative z-10 max-w-xl lg:mr-48">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting()}
          {user && `, ${user.name.split(" ")[0]}`}. 👋
        </h2>
        <p className="mt-3 text-sm/6 text-white/70 md:text-base/7">
          We are here to provide you with reliable informations and Investments opportunity. don&apos;t miss out on this
          amazing offer while it lasts.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/referrals" />}
          className="mt-4 h-9 rounded-sm bg-accent px-3 text-accent-foreground hover:bg-accent/85"
        >
          Join our affiliate program
        </Button>
      </div>
      <BannerArt />
    </section>
  );
}

const STAT_MENU_ITEMS = ["Print data", "Reset data", "Download data"];

const PAYOUT_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

function StatCard({ title, amount, detail }: { title: string; amount: string; detail: string }) {
  return (
    <Card className="ring-0">
      <CardHeader className="flex items-center justify-between border-b border-dashed px-5 pb-3">
        <CardTitle className="font-normal">{title}</CardTitle>
        <CardMenu label={title} items={STAT_MENU_ITEMS} />
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-2 px-5 pb-1">
        <p className="text-xl font-semibold tracking-tight tabular-nums">{amount}</p>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function Client$DashboardPage() {
  const { data: user } = useCurrentUser();
  const isCorporate = user?.accountType === "corporate";
  const { data: dashboard } = useMockQuery({
    key: "dashboard",
    schema: homeDashboardSchema,
    mock: HOME_DASHBOARD,
  });
  const stats = dashboard
    ? [
        {
          title: isCorporate ? "Treasury balance" : "Wallet balance",
          amount: naira(dashboard.walletBalance),
          detail: `Total balance ${naira(totalBalance(dashboard))}`,
        },
        { title: "Portfolio value", amount: naira(dashboard.portfolioValue), detail: "Principal plus accrued yield" },
        {
          title: "Accrued yield",
          amount: naira(dashboard.accruedYield),
          detail: `${dashboard.averageYield}% average yield`,
        },
        {
          title: isCorporate ? "Active positions" : "Active investments",
          amount: String(dashboard.activeInvestments),
          detail: dashboard.nextPayout
            ? `Next payout ${PAYOUT_DATE.format(new Date(dashboard.nextPayout))}`
            : "No payout scheduled",
        },
      ]
    : [];

  return (
    <>
      {isCorporate ? <CorporateBanner /> : <WelcomeBanner />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{isCorporate ? "Treasury overview" : "Dashboard"}</h1>
        <Button className="h-10 rounded-full px-4" nativeButton={false} render={<Link href="/dashboard/wallet" />}>
          <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
          {isCorporate ? "Fund treasury" : "Fund wallet"}
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {isCorporate ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <AssetsCard />
          <CompanyProfileCard />
        </div>
      ) : (
        <AssetsCard />
      )}

      <Suspense fallback={<Skeleton className="h-150 rounded-xl" />}>
        <TransactionTables />
      </Suspense>
    </>
  );
}
