"use client";
import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { MultiAreaChart } from "@/components/primitives/multi-area-chart";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminInvestor } from "@/constant/schemas/admin-people";
import { ArrowRight01Icon, Download04Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CUSTOMER_HISTORY, INVESTORS, STAFF } from "../_operations/data";
import { money } from "../account/_data";
import { FilterChips, SegmentBar, StatusPill, downloadCsv, formatDate, toneBar, toneDot } from "../account/_ui";
import {
  ACCESS_TONES,
  ACCOUNT_TONES,
  Initials,
  InvestorSheet,
  KYC_TONES,
  PersonCell,
  portfolio,
  roleLabel,
} from "./_ui";

type KycFilter = "all" | AdminInvestor["kycStatus"];
const KYC_FILTERS = ["all", "pending", "escalated", "approved", "rejected"] as const;
const ACCOUNT_STATUSES = ["active", "suspended", "blacklisted"] as const;
const countBy = <K extends keyof AdminInvestor>(key: K, value: AdminInvestor[K]) =>
  INVESTORS.filter((investor) => investor[key] === value).length;

const columns: ColumnDef<AdminInvestor>[] = [
  {
    accessorKey: "name",
    header: "Investor",
    cell: ({ row }) => <PersonCell name={row.original.name} detail={row.original.email} />,
  },
  {
    accessorKey: "id",
    header: "Reference",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  {
    accessorKey: "investmentCount",
    header: "Investments",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.investmentCount} · {row.original.units} units
      </span>
    ),
  },
  {
    id: "portfolio",
    header: () => <span className="block text-right">Portfolio</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold whitespace-nowrap text-foreground tabular-nums">
        {money(portfolio(row.original))}
      </span>
    ),
  },
  {
    accessorKey: "kycStatus",
    header: "KYC",
    cell: ({ row }) => <StatusPill tone={KYC_TONES[row.original.kycStatus]}>{row.original.kycStatus}</StatusPill>,
  },
  {
    accessorKey: "status",
    header: "Account",
    cell: ({ row }) => <StatusPill tone={ACCOUNT_TONES[row.original.status]}>{row.original.status}</StatusPill>,
  },
];

function PeopleCard() {
  const aum = INVESTORS.reduce((total, investor) => total + portfolio(investor), 0);
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">People on CityCore</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{INVESTORS.length + STAFF.length}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">Illustrative directory</span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <SegmentBar
          className="h-2.5 bg-white/10"
          parts={ACCOUNT_STATUSES.map((status) => ({
            key: status,
            value: countBy("status", status),
            className: { active: "bg-accent", suspended: "bg-white/40", blacklisted: "bg-destructive" }[status],
          }))}
        />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {ACCOUNT_STATUSES.map((status) => (
            <p key={status} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  { active: "bg-accent", suspended: "bg-white/40", blacklisted: "bg-destructive" }[status]
                )}
              />
              <span className="text-white/60 capitalize">{status}</span>
              <span className="font-semibold tabular-nums">{countBy("status", status)}</span>
            </p>
          ))}
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Investors", value: INVESTORS.length, note: "accounts" },
          { label: "Staff", value: STAFF.length, note: `${STAFF.filter((s) => s.twoFactor).length} with 2FA` },
          { label: "Portfolio", value: money(aum), note: "principal and yield" },
        ].map(({ label, value, note }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-white/60">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
            <dd className="truncate text-xs text-white/50">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function VerificationCard() {
  const [period, setPeriod] = React.useState<"this" | "last">("this");
  // ponytail: last week is a scaled copy of the sample until the overview API returns real history.
  const weekOf = (p: typeof period) =>
    CUSTOMER_HISTORY.map((day) => (p === "this" ? day : { ...day, approved: Math.round(day.approved * 0.85) }));
  const totalOf = (days: typeof CUSTOMER_HISTORY) =>
    days.reduce((total, day) => total + day.approved + day.pending + day.rejected, 0);
  const data = weekOf(period);
  const week = {
    approved: data.reduce((total, day) => total + day.approved, 0),
    pending: data.reduce((total, day) => total + day.pending, 0),
    rejected: data.reduce((total, day) => total + day.rejected, 0),
  };
  const all = totalOf(data);

  return (
    <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Verification activity</h2>
          <p className="text-xs text-muted-foreground">Sample daily KYC outcomes, separate from the directory</p>
        </div>
        <FilterChips
          label="Week"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "this", label: "This week", count: totalOf(weekOf("this")) },
            { value: "last", label: "Last week", count: totalOf(weekOf("last")) },
          ]}
        />
      </div>
      <dl className="grid grid-cols-3 gap-4">
        {[
          { label: "Approved", value: week.approved, color: "var(--chart-1)" },
          { label: "Pending", value: week.pending, color: "var(--chart-3)" },
          { label: "Rejected", value: week.rejected, color: "var(--chart-2)" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-light tabular-nums">{value.toLocaleString("en-NG")}</dd>
            <dd className="text-xs text-muted-foreground tabular-nums">{Math.round((value / all) * 100)}%</dd>
          </div>
        ))}
      </dl>
      <MultiAreaChart
        data={data}
        xAxisKey="day"
        className="h-56 w-full"
        series={[
          { key: "approved", label: "Approved", color: "var(--chart-1)" },
          { key: "pending", label: "Pending", color: "var(--chart-3)", dashed: true },
          { key: "rejected", label: "Rejected", color: "var(--chart-2)" },
        ]}
      />
    </Card>
  );
}

function KycQueueCard() {
  const groups = (["approved", "pending", "escalated", "rejected"] as const).map((status) => ({
    status,
    count: countBy("kycStatus", status),
  }));
  const queue = INVESTORS.filter((investor) => investor.kycStatus === "pending" || investor.kycStatus === "escalated");
  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">KYC queue</h2>
        <Link
          href="/kyc"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Open KYC
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
        </Link>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Awaiting a decision</p>
        <p className="mt-1 text-3xl font-light tabular-nums">{queue.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {countBy("kycStatus", "escalated")} escalated · {countBy("kycStatus", "approved")} of {INVESTORS.length}{" "}
          verified
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <SegmentBar
          className="bg-muted"
          parts={groups.map(({ status, count }) => ({
            key: status,
            value: count,
            className: toneBar(KYC_TONES[status]),
          }))}
        />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {groups.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(KYC_TONES[status]))} />
              <dt className="text-muted-foreground capitalize">{status}</dt>
              <dd className="ml-auto font-semibold tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ul className="flex flex-col border-t border-border">
        {queue.slice(0, 3).map((investor) => (
          <li key={investor.id}>
            <Link
              href={`/kyc/review?investor=${encodeURIComponent(investor.id)}`}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Initials name={investor.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{investor.name}</span>
                <span className="block text-xs text-muted-foreground">Tier {investor.tier}</span>
              </span>
              <StatusPill tone={KYC_TONES[investor.kycStatus]}>{investor.kycStatus}</StatusPill>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StaffCard() {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Admin team</h2>
        <Link
          href="/users/access"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage access
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
        </Link>
      </div>
      <ul className="flex flex-col">
        {STAFF.map((staff) => (
          <li key={staff.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-none">
            <Initials name={staff.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{staff.name}</span>
              <span className="block text-xs text-muted-foreground">{roleLabel(staff.role)}</span>
            </span>
            {!staff.twoFactor && (
              <span className="text-xs text-warning" title="Two-factor enrolment required">
                No 2FA
              </span>
            )}
            <StatusPill tone={ACCESS_TONES[staff.access]}>{staff.access}</StatusPill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function UsersOverview() {
  const router = useRouter();
  const [kyc, setKyc] = React.useState<KycFilter>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("recent");
  const [selected, setSelected] = React.useState<AdminInvestor | null>(null);

  const term = search.trim().toLowerCase();
  const rows = INVESTORS.filter((row) => kyc === "all" || row.kycStatus === kyc)
    .filter((row) => !term || `${row.name} ${row.id} ${row.email}`.toLowerCase().includes(term))
    .toSorted((a, b) => {
      if (sort === "portfolio") return portfolio(b) - portfolio(a);
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.joinedAt.localeCompare(a.joinedAt);
    });

  const exportRows = () =>
    downloadCsv(
      "citycore-investors.csv",
      ["Reference", "Name", "Email", "Phone", "Joined", "Account", "KYC", "Tier", "Investments", "Portfolio"],
      rows.map((r) => [
        r.id,
        r.name,
        r.email,
        r.phone,
        formatDate(r.joinedAt),
        r.status,
        r.kycStatus,
        r.tier,
        r.investmentCount,
        portfolio(r),
      ])
    );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Users & Admins</h1>
          <p className="text-sm text-muted-foreground">Investor accounts, verification and the team behind them</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/users/access" />}
          >
            <HugeiconsIcon icon={SecurityCheckIcon} aria-hidden />
            Staff & access
          </Button>
          <Button className="h-10 rounded-full px-4" nativeButton={false} render={<Link href="/users/management" />}>
            Manage investors
          </Button>
        </div>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          <PeopleCard />
          <VerificationCard />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <KycQueueCard />
          <StaffCard />
        </div>
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Investor directory</h2>
            <p className="text-xs text-muted-foreground">Select a row for a quick look</p>
          </div>
          <Button variant="outline" className="h-9 rounded-full px-3.5" onClick={exportRows} disabled={!rows.length}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden />
            Export CSV
          </Button>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <FilterChips
            label="KYC status"
            value={kyc}
            onChange={setKyc}
            options={KYC_FILTERS.map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: value === "all" ? INVESTORS.length : countBy("kycStatus", value),
            }))}
          />
          <div className="flex flex-1 gap-2 lg:justify-end">
            <SearchField
              id="users-search"
              value={search}
              onChange={setSearch}
              placeholder="Search name, email or reference"
              className="min-w-0 flex-1 lg:max-w-72"
              groupClassName="h-9 bg-card dark:bg-card"
            />
            <SelectField
              id="users-sort"
              value={sort}
              onChange={setSort}
              triggerAria-label="Sort"
              triggerClassName="h-9! w-36 rounded-full bg-card px-3.5"
              items={[
                { value: "recent", label: "Newest" },
                { value: "portfolio", label: "Largest portfolio" },
                { value: "name", label: "Name A–Z" },
              ]}
            />
          </div>
        </div>
        <DataTable
          key={`${kyc}-${search}-${sort}`}
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          pageSize={8}
          onRowClick={setSelected}
          rowClassName="border-none even:bg-muted/50 hover:bg-muted"
          actionsHeader="Action"
          actions={[
            { label: "Quick look", onClick: setSelected },
            {
              label: "Open profile",
              onClick: (i) => router.push(`/users/management?investor=${encodeURIComponent(i.id)}`),
            },
            { label: "View KYC case", onClick: (i) => router.push(`/kyc/review?investor=${encodeURIComponent(i.id)}`) },
          ]}
          emptyMessage="No investors match these filters."
        />
      </Card>

      <InvestorSheet investor={selected} onClose={() => setSelected(null)} />
    </>
  );
}
