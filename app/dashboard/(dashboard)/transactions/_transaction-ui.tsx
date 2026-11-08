"use client";

import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  Building03Icon,
  ChartLineData01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";

import { naira } from "../marketplace/page";
import { TRANSACTION_TYPE_LABELS, type Transaction, isCredit, transactionReference } from "./_data";

const DATE_TIME = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});
export const formatTransactionDate = (iso: string) => DATE_TIME.format(new Date(iso));

const TYPE_ICONS: Record<Transaction["type"], IconSvgElement> = {
  deposit: ArrowDownLeft01Icon,
  withdrawal: ArrowUpRight01Icon,
  investment: Building03Icon,
  payout: ChartLineData01Icon,
  commission: Coins01Icon,
};

const STATUS_STYLES: Record<Transaction["status"], string> = {
  successful: "border-transparent bg-success/12 text-success",
  pending: "border-transparent bg-warning/15 text-warning",
  failed: "border-destructive/25 bg-destructive/5 text-destructive",
};
const STATUS_LABELS: Record<Transaction["status"], string> = {
  successful: "Successful",
  pending: "Pending",
  failed: "Failed",
};

export function TransactionStatusBadge({ status }: { status: Transaction["status"] }) {
  return <Badge className={cn("h-7 rounded-full border px-3", STATUS_STYLES[status])}>{STATUS_LABELS[status]}</Badge>;
}

export function TransactionTitle({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
        <HugeiconsIcon icon={TYPE_ICONS[transaction.type]} aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-foreground">{transaction.title}</span>
        <span className="text-xs">{formatTransactionDate(transaction.date)}</span>
      </div>
    </div>
  );
}

export function TransactionAmount({ transaction }: { transaction: Transaction }) {
  const credit = isCredit(transaction);
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        transaction.status === "failed" ? "text-muted-foreground line-through" : credit && "text-success",
        !credit && transaction.status !== "failed" && "text-foreground"
      )}
    >
      {credit ? "+" : "-"}
      {naira(Math.abs(transaction.amount))}
    </span>
  );
}

export const TRANSACTION_COLUMNS = {
  title: {
    id: "title",
    accessorKey: "title",
    header: "Transaction",
    enableSorting: false,
    cell: ({ row }) => <TransactionTitle transaction={row.original} />,
  },
  type: {
    id: "type",
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => TRANSACTION_TYPE_LABELS[row.original.type],
  },
  reference: {
    id: "reference",
    header: "Reference",
    enableSorting: false,
    cell: ({ row }) => <span className="tabular-nums">{transactionReference(row.original)}</span>,
  },
  amount: {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    enableSorting: false,
    cell: ({ row }) => <TransactionAmount transaction={row.original} />,
  },
  status: {
    id: "status",
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
  },
} satisfies Record<string, ColumnDef<Transaction, unknown>>;
