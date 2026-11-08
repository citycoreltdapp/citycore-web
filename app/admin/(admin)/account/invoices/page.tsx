"use client";

import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type AdminInvoice } from "@/constant/schemas/admin-account";
import { Add01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";

import { dueLabel, money } from "../_data";
import { copyInvoiceNumber, openInvoice, printInvoice } from "../_invoice-preview";
import { useAccount } from "../_store";
import { FilterChips, INVOICE_TONES, StatusPill, formatDate } from "../_ui";

type StatusFilter = "all" | AdminInvoice["status"];
const STATUSES = ["all", "unpaid", "paid", "rejected", "draft"] as const;

const columns: ColumnDef<AdminInvoice>[] = [
  {
    accessorKey: "description",
    header: "Invoice",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="max-w-60 truncate font-semibold text-foreground">{row.original.description}</p>
        <p className="text-xs">{row.original.companyName}</p>
      </div>
    ),
  },
  {
    accessorKey: "invoiceNumber",
    header: "Number",
    cell: ({ getValue }) => <span className="tabular-nums">#{getValue<string>()}</span>,
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => {
      const { status, dueDate } = row.original;
      const due = dueLabel(dueDate);
      const isSettled = status === "paid" || status === "rejected";
      return (
        <div>
          <p className="text-foreground tabular-nums">{formatDate(dueDate)}</p>
          <p className={cn("text-xs", !isSettled && due.isOverdue && "text-destructive")}>
            {isSettled ? (status === "paid" ? "Settled" : "Closed") : due.text}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ getValue }) => (
      <span className="block text-right font-semibold whitespace-nowrap text-foreground tabular-nums">
        {money(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusPill tone={INVOICE_TONES[row.original.status]}>{row.original.status}</StatusPill>,
  },
];

export default function InvoicesPage() {
  const { invoices, ready } = useAccount();
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("recent");

  const term = search.trim().toLowerCase();
  const rows = invoices
    .filter((row) => status === "all" || row.status === status)
    .filter((row) => !term || `${row.description} ${row.invoiceNumber} ${row.companyName}`.toLowerCase().includes(term))
    .toSorted((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "due") return a.dueDate.localeCompare(b.dueDate);
      return sort === "recent" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt);
    });

  const totalOf = (value: AdminInvoice["status"]) =>
    invoices.filter((row) => row.status === value).reduce((total, row) => total + row.amount, 0);
  const countOf = (value: StatusFilter) => invoices.filter((row) => value === "all" || row.status === value).length;
  const overdue = invoices.filter((row) => row.status === "unpaid" && dueLabel(row.dueDate).isOverdue).length;

  return (
    <>
      <Link
        href="/account"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        Account
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Billing activity and saved drafts · illustrative data</p>
        </div>
        <Button className="h-10 rounded-full px-4" nativeButton={false} render={<Link href="/account/invoices/new" />}>
          <HugeiconsIcon icon={Add01Icon} aria-hidden />
          New invoice
        </Button>
      </header>

      <Card className="rounded-2xl px-5 py-5 ring-foreground/8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {[
            {
              label: "Outstanding",
              value: money(totalOf("unpaid")),
              note: overdue ? `${countOf("unpaid")} unpaid · ${overdue} overdue` : `${countOf("unpaid")} unpaid`,
            },
            { label: "Collected", value: money(totalOf("paid")), note: `${countOf("paid")} paid` },
            { label: "Rejected", value: money(totalOf("rejected")), note: `${countOf("rejected")} invoices` },
            { label: "Drafts", value: String(countOf("draft")), note: "saved in this browser" },
          ].map(({ label, value, note }) => (
            <div key={label} className="min-w-0 xl:pl-5 xl:first:pl-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 truncate text-2xl font-light tabular-nums">{value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <FilterChips
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: countOf(value),
            }))}
          />
          <div className="flex flex-1 gap-2 lg:justify-end">
            <SearchField
              id="invoice-search"
              value={search}
              onChange={setSearch}
              placeholder="Search title, number or company"
              className="min-w-0 flex-1 lg:max-w-72"
              groupClassName="h-9 bg-card dark:bg-card"
            />
            <SelectField
              id="invoice-sort"
              value={sort}
              onChange={setSort}
              triggerAria-label="Sort"
              triggerClassName="h-9! w-32 rounded-full bg-card px-3.5"
              items={[
                { value: "recent", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "due", label: "Due soonest" },
                { value: "amount", label: "Largest" },
              ]}
            />
          </div>
        </div>

        <DataTable
          key={`${status}-${search}-${sort}`}
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          isLoading={!ready}
          pageSize={10}
          onRowClick={openInvoice}
          rowClassName="border-none even:bg-muted/50 hover:bg-muted"
          actionsHeader="Action"
          actions={[
            { label: "View invoice", onClick: openInvoice },
            { label: "Print or save PDF", onClick: printInvoice },
            { label: "Copy number", onClick: copyInvoiceNumber },
          ]}
          emptyMessage="No invoices match these filters."
        />
      </Card>
    </>
  );
}
