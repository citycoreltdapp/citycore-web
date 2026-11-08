"use client";

import * as React from "react";

import { DataTable, type TableAction } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transactionListResponseSchema } from "@/constant/schemas/finance";
import { API_ROUTES } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";

import { naira } from "../marketplace/page";
import {
  TRANSACTIONS,
  TRANSACTION_TYPE_LABELS,
  type Transaction,
  type TransactionType,
  transactionReference,
} from "./_data";
import { TRANSACTION_COLUMNS } from "./_transaction-ui";

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
];

const TYPE_FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "investment", label: "Investments" },
  { value: "payout", label: "Payouts" },
  { value: "commission", label: "Commission" },
];

const COLUMNS: ColumnDef<Transaction, unknown>[] = Object.values(TRANSACTION_COLUMNS);

const ACTIONS: TableAction<Transaction>[] = [
  { label: "Download receipt", onClick: () => toast.info("Receipts aren't connected to a backend yet.") },
  { label: "Print", onClick: () => toast.info("Printing isn't connected to a backend yet.") },
];

function totals(transactions: Transaction[]) {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const tx of transactions) {
    if (tx.status === "failed") continue;
    if (tx.amount >= 0) moneyIn += tx.amount;
    else moneyOut += Math.abs(tx.amount);
  }
  return { moneyIn, moneyOut };
}

export default function Client$TransactionsPage() {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState(SORT_OPTIONS[0].value);
  const [type, setType] = React.useState<TransactionType | "all">("all");

  const { data: transactions } = useApiQuery({
    path: API_ROUTES.walletTransactions,
    schema: transactionListResponseSchema,
    mock: TRANSACTIONS,
  });
  const term = search.trim().toLowerCase();
  const matching = (transactions ?? []).filter(
    (tx) =>
      (type === "all" || tx.type === type) &&
      (!term ||
        tx.title.toLowerCase().includes(term) ||
        transactionReference(tx).toLowerCase().includes(term) ||
        TRANSACTION_TYPE_LABELS[tx.type].toLowerCase().includes(term))
  );
  const rows = sort === "oldest" ? matching.toReversed() : matching;
  const { moneyIn, moneyOut } = totals(matching);

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
            <DropdownMenuItem render={<Link href="/dashboard/transactions/reports" />}>Yearly Reports</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/wallet" />}>Wallet Overview</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed px-5 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">History</CardTitle>
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="text-success">In {naira(moneyIn)}</span>
              <span aria-hidden> · </span>
              <span>Out {naira(moneyOut)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <SearchField
              id="transactions-search"
              aria-label="Search by name or reference"
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
        <CardContent className="flex flex-col gap-4 px-5">
          <Tabs value={type} onValueChange={(next) => setType(next as TransactionType | "all")}>
            <TabsList aria-label="Transaction type" className="flex-wrap">
              {TYPE_FILTERS.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <DataTable
            columns={COLUMNS}
            data={rows}
            pageSize={18}
            enableBulkSelect
            actions={ACTIONS}
            actionsHeader="Action"
            getRowId={(transaction) => transaction.id}
            rowClassName="border-none even:[&>td]:bg-muted"
            emptyMessage="No transactions match your filters."
          />
        </CardContent>
      </Card>
    </>
  );
}
