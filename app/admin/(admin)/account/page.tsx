"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type AdminAccountTransaction, type AdminInvoice } from "@/constant/schemas/admin-account";
import {
  Add01Icon,
  ArrowDownLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Copy01Icon,
  Download04Icon,
  Invoice01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { ACCOUNT_TRANSACTIONS, AS_OF, CATEGORY_LABELS, TEMPLATE_LABELS, dueLabel, money } from "./_data";
import { useAccount } from "./_store";

function TransactionSheet({
  transaction,
  onClose,
}: {
  transaction: AdminAccountTransaction | null;
  onClose: () => void;
}) {
  const { invoices } = useAccount();
  const invoice = transaction && invoices.find((item) => item.invoiceNumber === transaction.invoiceNumber);
  const isCredit = transaction?.direction === "credit";

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {transaction && (
          <>
            <SheetHeader className="gap-1 border-b border-border p-6">
              <span
                className={cn(
                  "mb-3 flex size-11 items-center justify-center rounded-full",
                  isCredit ? "bg-success/12 text-success" : "bg-muted text-foreground"
                )}
              >
                <HugeiconsIcon icon={isCredit ? ArrowDownLeft01Icon : ArrowUpRight01Icon} aria-hidden />
              </span>
              <SheetTitle className="text-base font-semibold">{transaction.title}</SheetTitle>
              <SheetDescription>
                {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
              </SheetDescription>
              <p className={cn("mt-3 text-3xl font-light tabular-nums", isCredit && "text-success")}>
                {isCredit ? "+" : "−"}
                {money(transaction.amount)}
              </p>
              <div className="mt-2">
                <StatusPill tone={TRANSACTION_TONES[transaction.status]}>{transaction.status}</StatusPill>
              </div>
            </SheetHeader>

            <dl className="flex flex-col p-6 text-sm">
              {[
                ["Direction", isCredit ? "Money in" : "Money out"],
                ["Medium", transaction.medium],
                ["Invoice", `#${transaction.invoiceNumber}`],
                ["Reference", transaction.id],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-border py-3 last:border-none">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-border p-6">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() =>
                  navigator.clipboard
                    .writeText(transaction.id)
                    .then(() => toast.success("Reference copied."))
                    .catch(() => toast.error("Clipboard access is unavailable."))
                }
              >
                <HugeiconsIcon icon={Copy01Icon} aria-hidden />
                Copy reference
              </Button>
              {invoice && (
                <Button
                  className="flex-1 rounded-full"
                  onClick={() => {
                    onClose();
                    openInvoice(invoice);
                  }}
                >
                  <HugeiconsIcon icon={Invoice01Icon} aria-hidden />
                  Open invoice
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

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
          href="/admin/account/invoices"
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

export default function AccountOverview() {
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
            render={<Link href="/admin/account/invoices/new" />}
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

export type Tone = "success" | "warning" | "danger" | "muted";

const TONE_STYLES: Record<Tone, { pill: string; dot: string; bar: string }> = {
  success: { pill: "bg-success/12 text-success", dot: "bg-success", bar: "bg-success" },
  warning: { pill: "bg-warning/12 text-warning", dot: "bg-warning", bar: "bg-warning" },
  danger: { pill: "bg-destructive/10 text-destructive", dot: "bg-destructive", bar: "bg-destructive" },
  muted: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", bar: "bg-muted-foreground/50" },
};

export const toneBar = (tone: Tone) => TONE_STYLES[tone].bar;
export const toneDot = (tone: Tone) => TONE_STYLES[tone].dot;

export const TRANSACTION_TONES = { successful: "success", pending: "warning", cancelled: "danger" } as const;
export const INVOICE_TONES = { paid: "success", unpaid: "warning", rejected: "danger", draft: "muted" } as const;

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold capitalize",
        TONE_STYLES[tone].pill
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", TONE_STYLES[tone].dot)} />
      {children}
    </span>
  );
}

/** A row of filter pills, each showing how many rows it would leave. */
export function FilterChips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  isActive ? "bg-foreground text-background" : "bg-background/70"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A thin bar split into coloured parts by value. */
export function SegmentBar({
  parts,
  className,
}: {
  parts: { key: string; value: number; className: string }[];
  className?: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div aria-hidden className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full", className)}>
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <span
            key={part.key}
            className={cn("h-full rounded-full transition-[flex-grow] duration-500", part.className)}
            style={{ flexGrow: part.value / total }}
          />
        ))}
    </div>
  );
}

// Formatted in UTC so the server and the browser print the same thing.
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
export const formatDate = (iso: string) => DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
export const formatTime = (iso: string) => TIME.format(new Date(iso));

/**
 * Downloads rows as a CSV file. Values are quoted so commas survive, and text starting with = + or @ gets a
 * leading apostrophe so a spreadsheet can't run it as a formula.
 */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = typeof value === "string" && /^[=+@\t\r]/.test(value) ? `'${value}` : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** What the document needs. A draft being typed can have blanks, so everything is optional except the money. */
export type InvoiceDocumentData = Partial<Omit<AdminInvoice, "amount" | "rate">> & { amount: number; rate: number };

function Field({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("mt-1 truncate text-sm font-semibold", !value && "font-normal text-muted-foreground/60")}>
        {value || "—"}
      </dd>
    </div>
  );
}

/** The invoice itself, shared by the preview, the live preview while writing one, and the printed copy. */
export function InvoiceDocument({ invoice, className }: { invoice: InvoiceDocumentData; className?: string }) {
  const due = invoice.dueDate ? dueLabel(invoice.dueDate) : null;

  return (
    <article className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8", className)}>
      <header className="flex items-start justify-between gap-4 bg-[#121212] p-5 text-white">
        <div className="flex items-center gap-2.5">
          <Image src="/assets/images/logo.png" alt="" width={34} height={40} className="size-8 object-contain" />
          <div>
            <p className="text-sm font-semibold">City Core</p>
            <p className="text-xs text-white/60">Invoice</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Invoice no.</p>
          <p className="text-base font-semibold tabular-nums">#{invoice.invoiceNumber || "—"}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {invoice.status ? (
            <StatusPill tone={INVOICE_TONES[invoice.status]}>{invoice.status}</StatusPill>
          ) : (
            <StatusPill tone="muted">Not saved</StatusPill>
          )}
          {due && invoice.status !== "paid" && (
            <p className={cn("text-xs", due.isOverdue ? "text-destructive" : "text-muted-foreground")}>{due.text}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Billed to" value={invoice.companyName} className="col-span-2" />
          <div className="col-span-2 -mt-3 text-xs/5 text-muted-foreground">
            {[invoice.address, invoice.email, invoice.phone].filter(Boolean).join(" · ") || "Address and contact"}
          </div>
          <Field label="Issued" value={invoice.createdAt ? formatDate(invoice.createdAt) : undefined} />
          <Field label="Due" value={invoice.dueDate ? formatDate(invoice.dueDate) : undefined} />
          <Field label="Template" value={invoice.template ? TEMPLATE_LABELS[invoice.template] : undefined} />
          <Field label="Category" value={invoice.category ? CATEGORY_LABELS[invoice.category] : undefined} />
        </dl>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Service</p>
              <p className={cn("mt-1 text-sm/6 wrap-break-word", !invoice.description && "text-muted-foreground/60")}>
                {invoice.description || "What you're billing for"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">Rate {invoice.rate || 0}%</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{money(invoice.amount || 0)}</p>
          </div>
        </div>

        <dl className="ml-auto flex w-full max-w-60 flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money(invoice.amount || 0)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>Tax</dt>
            <dd className="tabular-nums">{money(0)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="text-xl font-light tabular-nums">{money(invoice.amount || 0)}</dd>
          </div>
        </dl>

        <p className="text-[11px]/4 text-muted-foreground">
          Illustrative invoice. The rate is service metadata; no tax is added.
        </p>
      </div>
    </article>
  );
}

/** Opens a print window with a plain copy. Built from text nodes, so invoice fields can't inject markup. */
export function printInvoice(invoice: AdminInvoice) {
  const popup = window.open("", "_blank", "width=820,height=900");
  if (!popup) {
    toast.error("Allow pop-ups to print or save this invoice as PDF.");
    return;
  }
  const doc = popup.document;
  doc.title = `Invoice ${invoice.invoiceNumber}`;
  const style = doc.createElement("style");
  style.textContent = [
    "body{font:14px/1.6 Lato,system-ui,sans-serif;color:#121212;margin:0;padding:48px}",
    "header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #121212;padding-bottom:16px}",
    "h1{font-size:28px;font-weight:300;margin:0}.muted{color:#6c635a}.label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6c635a}",
    "section{margin-top:28px}.row{display:flex;justify-content:space-between;gap:24px;padding:6px 0}",
    ".total{border-top:1px solid #e4dbd1;margin-top:8px;padding-top:12px;font-size:20px}",
  ].join("");
  doc.head.append(style);

  const add = (parent: HTMLElement, tag: string, text = "", className = "") => {
    const element = doc.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  };
  const header = add(doc.body, "header");
  const brand = add(header, "div");
  add(brand, "div", "City Core", "label");
  add(brand, "h1", "Invoice");
  const meta = add(header, "div");
  add(meta, "div", `#${invoice.invoiceNumber}`);
  add(meta, "div", invoice.status.toUpperCase(), "muted");

  const billed = add(doc.body, "section");
  add(billed, "div", "Billed to", "label");
  add(billed, "div", invoice.companyName);
  add(billed, "div", `${invoice.address} · ${invoice.email} · ${invoice.phone}`, "muted");

  const dates = add(doc.body, "section");
  for (const [label, value] of [
    ["Issued", formatDate(invoice.createdAt)],
    ["Due", formatDate(invoice.dueDate)],
    ["Template", TEMPLATE_LABELS[invoice.template]],
  ]) {
    const row = add(dates, "div", "", "row");
    add(row, "span", label, "muted");
    add(row, "span", value);
  }

  const service = add(doc.body, "section");
  add(service, "div", "Service", "label");
  const line = add(service, "div", "", "row");
  add(line, "span", `${invoice.description} (rate ${invoice.rate}%)`);
  add(line, "span", money(invoice.amount));
  const total = add(service, "div", "", "row total");
  add(total, "span", "Total");
  add(total, "span", money(invoice.amount));

  add(doc.body, "p", "Illustrative invoice. The rate is service metadata; no tax is added.", "muted");
  popup.focus();
  popup.print();
}

export function copyInvoiceNumber(invoice: AdminInvoice) {
  navigator.clipboard
    .writeText(invoice.invoiceNumber)
    .then(() => toast.success(`Copied #${invoice.invoiceNumber}.`))
    .catch(() => toast.error("Clipboard access is unavailable."));
}

export function openInvoice(invoice: AdminInvoice) {
  AppModal.open({
    title: invoice.description,
    description: `${invoice.companyName} · #${invoice.invoiceNumber}`,
    content: <InvoiceDocument invoice={invoice} />,
    footer: (
      <div className="flex w-full flex-wrap justify-end gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => copyInvoiceNumber(invoice)}>
          <HugeiconsIcon icon={Copy01Icon} aria-hidden />
          Copy number
        </Button>
        <Button className="rounded-full" onClick={() => printInvoice(invoice)}>
          <HugeiconsIcon icon={PrinterIcon} aria-hidden />
          Print or save PDF
        </Button>
      </div>
    ),
  });
}
