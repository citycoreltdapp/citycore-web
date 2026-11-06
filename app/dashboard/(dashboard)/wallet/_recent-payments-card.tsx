"use client";

import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { toast } from "sonner";

import { PAYMENTS, PAYMENT_STATUSES, type Payment, type PaymentStatus } from "./_data";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  Successful: "border-transparent bg-muted text-foreground",
  Pending: "border-transparent bg-warning/15 text-warning",
  Cancel: "border-destructive/25 bg-destructive/5 text-destructive",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: status })),
];

const COLUMNS: ColumnDef<Payment, unknown>[] = [
  {
    accessorKey: "id",
    header: "Payment ID",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground tabular-nums">{row.original.id}</span>
        <span className="text-xs">{row.original.card}</span>
      </div>
    ),
  },
  { accessorKey: "account", header: "Transfer Account", enableSorting: false },
  {
    accessorKey: "money",
    header: "Money",
    cell: ({ row }) => (
      <span className="font-semibold text-foreground tabular-nums">₦{row.original.money.toLocaleString("en-US")}</span>
    ),
  },
  { accessorKey: "medium", header: "Medium" },
  { accessorKey: "date", header: "Date", enableSorting: false },
  { accessorKey: "time", header: "Time", enableSorting: false },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={cn("h-7 rounded-full border px-3", STATUS_STYLES[row.original.status])}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "pdf",
    header: "PDF",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Download ${row.original.id} as PDF`}
        // ponytail: no backend yet, so there's no receipt to download.
        onClick={() => toast.info("Receipts aren't connected to a backend yet.")}
      >
        <HugeiconsIcon icon={Download01Icon} aria-hidden />
      </Button>
    ),
  },
];

export function RecentPaymentsCard() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const term = search.trim().toLowerCase();
  const rows = PAYMENTS.filter(
    (payment) =>
      (status === "all" || payment.status === status) &&
      (!term || `${payment.id} ${payment.account} ${payment.medium}`.toLowerCase().includes(term))
  );

  return (
    <Card className="rounded-2xl ring-foreground/8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <SearchField
            id="recent-payments-search"
            aria-label="Search payments"
            className="w-full sm:w-64"
            groupClassName="rounded-full border-none bg-muted dark:bg-muted"
            buttonClassName="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            value={search}
            onChange={setSearch}
            onSearch={setSearch}
          />
          <SelectField
            id="recent-payments-status"
            label="Status :"
            value={status}
            onChange={setStatus}
            items={STATUS_FILTERS}
            className="flex-row items-center"
            labelClassName="font-normal whitespace-nowrap text-muted-foreground"
            triggerClassName="h-10! min-w-20 rounded-full px-3.5"
            contentClassName="min-w-32"
          />
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <DataTable
          columns={COLUMNS}
          data={rows}
          pageSize={8}
          getRowId={(payment) => payment.key}
          rowClassName="border-none even:[&>td]:bg-muted"
          emptyMessage="No payments match your search."
        />
      </CardContent>
    </Card>
  );
}
