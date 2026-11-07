"use client";
import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminAccountTransaction } from "@/constant/schemas/admin-account";
import {
  Add01Icon,
  ArrowDownLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";

import { ACCOUNT_TRANSACTIONS, AS_OF, money } from "./_data";
import { openInvoice } from "./_invoice-preview";
import { useAccount } from "./_store";
import { TransactionSheet } from "./_transaction-sheet";
import {
  FilterChips,
  INVOICE_TONES,
  SegmentBar,
  StatusPill,
  TRANSACTION_TONES,
  downloadCsv,
  formatDate,
  formatTime,
  toneBar,
  toneDot,
} from "./_ui";

type Period = "all" | "week";
type StatusFilter = "all" | AdminAccountTransaction["status"];

const WEEK_START = new Date(Date.parse(`${AS_OF}T00:00:00Z`) - 3 * 86_400_000).toISOString();
const sum = (rows: AdminAccountTransaction[]) => rows.reduce((total, row) => total + row.amount, 0);

const columns: ColumnDef<AdminAccountTransaction>[] = [
  {
    accessorKey: "title",
    header: "Transaction",
    cell: ({ row }) => {
      const isCredit = row.original.direction === "credit";
      return (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              isCredit ? "bg-success/12 text-success" : "bg-muted text-foreground"
            )}
          >
            <HugeiconsIcon
              icon={isCredit ? ArrowDownLeft01Icon : ArrowUpRight01Icon}
              aria-label={isCredit ? "Money in" : "Money out"}
              className="size-4"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{row.original.title}</p>
            <p className="text-xs">
              {formatDate(row.original.createdAt)} · {formatTime(row.original.createdAt)}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice",
    cell: ({ getValue }) => <span className="tabular-nums">#{getValue<string>()}</span>,
  },
  { accessorKey: "medium", header: "Medium" },
  {
    accessorKey: "amount",
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ row }) => {
      const isCredit = row.original.direction === "credit";
      return (
        <span
          className={cn(
            "block text-right font-semibold whitespace-nowrap tabular-nums",
            isCredit ? "text-success" : "text-foreground"
          )}
        >
          {isCredit ? "+" : "−"}
          {money(row.original.amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusPill tone={TRANSACTION_TONES[row.original.status]}>{row.original.status}</StatusPill>,
  },
];

function BalanceCard({ rows, period }: { rows: AdminAccountTransaction[]; period: Period }) {
  const settled = rows.filter((row) => row.status === "successful");
  const moneyIn = sum(settled.filter((row) => row.direction === "credit"));
  const moneyOut = sum(settled.filter((row) => row.direction === "debit"));
  const pending = rows.filter((row) => row.status === "pending");
  const failed = rows.filter((row) => row.status === "cancelled");
  const net = moneyIn - moneyOut;

  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Net settled balance</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">
            {net < 0 ? "−" : ""}
            {money(Math.abs(net))}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          {period === "week" ? "Last 4 days" : "All time"}
        </span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <SegmentBar
          className="h-2.5 bg-white/10"
          parts={[
            { key: "in", value: moneyIn, className: "bg-accent" },
            { key: "out", value: moneyOut, className: "bg-white/35" },
          ]}
        />
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            <span className="text-white/60">In</span>
            <span className="font-semibold tabular-nums">{money(moneyIn)}</span>
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-white/35" />
            <span className="text-white/60">Out</span>
            <span className="font-semibold tabular-nums">{money(moneyOut)}</span>
          </p>
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Settled", value: settled.length, note: "transactions" },
          { label: "Pending", value: money(sum(pending)), note: `${pending.length} awaiting` },
          { label: "Failed", value: money(sum(failed)), note: `${failed.length} cancelled` },
        ].map(({ label, value, note }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-white/60">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
            <dd className="text-xs text-white/50">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function InvoiceHealthCard() {
  const { invoices } = useAccount();
  const groups = (["paid", "unpaid", "rejected", "draft"] as const).map((status) => {
    const rows = invoices.filter((invoice) => invoice.status === status);
    return { status, count: rows.length, total: rows.reduce((total, row) => total + row.amount, 0) };
  });
  const outstanding = groups.find((group) => group.status === "unpaid")!;
  const latest = invoices.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Invoices</h2>
        <Link
          href="/account/invoices"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
        </Link>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Outstanding</p>
        <p className="mt-1 text-3xl font-light tabular-nums">{money(outstanding.total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {outstanding.count} unpaid of {invoices.length} invoices
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SegmentBar
          className="bg-muted"
          parts={groups.map(({ status, total }) => ({
            key: status,
            value: total,
            className: toneBar(INVOICE_TONES[status]),
          }))}
        />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {groups.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(INVOICE_TONES[status]))} />
              <dt className="text-muted-foreground capitalize">{status}</dt>
              <dd className="ml-auto font-semibold tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="flex flex-col border-t border-border">
        {latest.map((invoice) => (
          <li key={invoice.id}>
            <button
              type="button"
              onClick={() => openInvoice(invoice)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", toneDot(INVOICE_TONES[invoice.status]))}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{invoice.description}</span>
                <span className="block text-xs text-muted-foreground">{invoice.companyName}</span>
              </span>
              <span className="text-sm tabular-nums">{money(invoice.amount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AccountOverview() {
  const [period, setPeriod] = React.useState<Period>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("recent");
  const [selected, setSelected] = React.useState<AdminAccountTransaction | null>(null);

  const periodRows = ACCOUNT_TRANSACTIONS.filter((row) => period === "all" || row.createdAt >= WEEK_START);
  const term = search.trim().toLowerCase();
  const rows = periodRows
    .filter((row) => status === "all" || row.status === status)
    .filter((row) => !term || `${row.title} ${row.invoiceNumber} ${row.medium}`.toLowerCase().includes(term))
    .toSorted((a, b) =>
      sort === "recent" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
    );
  const countOf = (value: StatusFilter) => periodRows.filter((row) => value === "all" || row.status === value).length;

  const exportRows = () =>
    downloadCsv(
      `citycore-transactions-${AS_OF}.csv`,
      ["Date", "Title", "Invoice", "Medium", "Direction", "Amount (NGN)", "Status"],
      rows.map((row) => [
        row.createdAt,
        row.title,
        row.invoiceNumber,
        row.medium,
        row.direction,
        row.direction === "credit" ? row.amount : -row.amount,
        row.status,
      ])
    );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-muted-foreground">Platform money movement and invoicing · illustrative data</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "all", label: "All time", count: ACCOUNT_TRANSACTIONS.length },
              {
                value: "week",
                label: "This week",
                count: ACCOUNT_TRANSACTIONS.filter((row) => row.createdAt >= WEEK_START).length,
              },
            ]}
          />
          <Button
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/account/invoices/new" />}
          >
            <HugeiconsIcon icon={Add01Icon} aria-hidden />
            New invoice
          </Button>
        </div>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <BalanceCard rows={periodRows} period={period} />
        <InvoiceHealthCard />
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">Transactions</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {rows.length} of {periodRows.length} shown · select a row for details
            </p>
          </div>
          <Button variant="outline" className="h-9 rounded-full px-3.5" disabled={!rows.length} onClick={exportRows}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <FilterChips
            label="Status"
            value={status}
            onChange={setStatus}
            options={(["all", "successful", "pending", "cancelled"] as const).map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: countOf(value),
            }))}
          />
          <div className="flex flex-1 gap-2 lg:justify-end">
            <SearchField
              id="account-search"
              value={search}
              onChange={setSearch}
              placeholder="Search title, invoice or medium"
              className="min-w-0 flex-1 lg:max-w-72"
              groupClassName="h-9 bg-card dark:bg-card"
            />
            <SelectField
              id="account-sort"
              value={sort}
              onChange={setSort}
              triggerAria-label="Sort"
              triggerClassName="h-9! w-28 rounded-full bg-card px-3.5"
              items={[
                { value: "recent", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
            />
          </div>
        </div>

        <DataTable
          key={`${period}-${status}-${search}-${sort}`}
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          pageSize={10}
          onRowClick={setSelected}
          rowClassName="border-none even:bg-muted/50 hover:bg-muted"
          emptyMessage="No transactions match these filters."
        />
      </Card>

      <TransactionSheet transaction={selected} onClose={() => setSelected(null)} />
    </>
  );
}
