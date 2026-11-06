"use client";

import * as React from "react";

import { DataTable, type TableAction } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";
import { toast } from "sonner";

import { TRANSACTIONS, type Transaction, type TransactionStatus } from "./_data";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  Successful: "border-transparent bg-muted text-foreground",
  Pending: "border-transparent bg-warning/15 text-warning",
  Cancel: "border-destructive/25 bg-destructive/5 text-destructive",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
];

const COLUMNS: ColumnDef<Transaction, unknown>[] = [
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
  { accessorKey: "invoice", header: "Invoice", enableSorting: false },
  { accessorKey: "medium", header: "Medium", enableSorting: false },
  { accessorKey: "amount", header: "Transaction", enableSorting: false },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge className={cn("h-7 rounded-full border px-3", STATUS_STYLES[row.original.status])}>
        {row.original.status}
      </Badge>
    ),
  },
];

// ponytail: no backend yet, so there's no receipt to fetch.
const ACTIONS: TableAction<Transaction>[] = [
  { label: "Download receipt", onClick: () => toast.info("Receipts aren't connected to a backend yet.") },
  { label: "Print", onClick: () => toast.info("Printing isn't connected to a backend yet.") },
];

export function Client$TransactionsPage() {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState(SORT_OPTIONS[0].value);

  const term = search.trim().toLowerCase();
  const matching = TRANSACTIONS.filter(
    (transaction) =>
      !term ||
      `${transaction.title} ${transaction.invoice} ${transaction.medium} ${transaction.status}`
        .toLowerCase()
        .includes(term)
  );
  const rows = sort === "oldest" ? matching.toReversed() : matching;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">All Transactions</h1>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="h-10 rounded-full px-4" />}>
            Account Overview
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem render={<Link href="/transactions/reports" />}>Yearly Reports</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/wallet" />}>Wallet Overview</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed px-5 pb-4">
          <CardTitle className="text-lg font-semibold">View All</CardTitle>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <SearchField
              id="transactions-search"
              aria-label="Search transactions"
              className="w-full sm:w-64"
              groupClassName="rounded-full border-none bg-muted dark:bg-muted"
              buttonClassName="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              value={search}
              onChange={setSearch}
              onSearch={setSearch}
            />
            <SelectField
              id="transactions-sort"
              label="Sort By :"
              value={sort}
              onChange={setSort}
              items={SORT_OPTIONS}
              className="flex-row items-center"
              labelClassName="font-normal whitespace-nowrap text-muted-foreground"
              triggerClassName="h-10! min-w-24 rounded-full px-3.5"
              contentClassName="min-w-32"
            />
          </div>
        </CardHeader>
        <CardContent className="px-5">
          <DataTable
            columns={COLUMNS}
            data={rows}
            pageSize={18}
            enableBulkSelect
            actions={ACTIONS}
            actionsHeader="Action"
            getRowId={(transaction) => transaction.key}
            rowClassName="border-none even:[&>td]:bg-muted"
            emptyMessage="No transactions match your search."
          />
        </CardContent>
      </Card>
    </>
  );
}
