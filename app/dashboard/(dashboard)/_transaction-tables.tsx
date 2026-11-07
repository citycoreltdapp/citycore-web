"use client";

import { CardMenu } from "@/components/dashboard/card-menu";
import { DataTable } from "@/components/primitives/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { LATEST_TRANSACTIONS, type LatestTransaction, TRANSACTION_ACCOUNTS, type TransactionAccount } from "./_data";

const TABLE_MENU_ITEMS = ["Print", "Remove", "Download"];

function TwoLineCell({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-foreground">{primary}</span>
      <span className="text-xs">{secondary}</span>
    </div>
  );
}

const LATEST_TRANSACTION_COLUMNS: ColumnDef<LatestTransaction, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: false,
    cell: ({ row }) => <TwoLineCell primary={row.original.title} secondary={row.original.date} />,
  },
  { accessorKey: "medium", header: "Medium", enableSorting: false },
  { accessorKey: "amount", header: "Transaction", enableSorting: false },
];

const TRANSACTION_ACCOUNT_COLUMNS: ColumnDef<TransactionAccount, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: false,
    cell: ({ row }) => <TwoLineCell primary={row.original.title} secondary={row.original.card} />,
  },
  {
    accessorKey: "money",
    header: "Money",
    enableSorting: false,
    cell: ({ row }) => <TwoLineCell primary={row.original.money} secondary="Account Balance" />,
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

export function TransactionTables() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TableCard title="Latest Transaction" href="/transactions">
        <DataTable
          columns={LATEST_TRANSACTION_COLUMNS}
          data={LATEST_TRANSACTIONS}
          getRowId={(row) => row.id}
          rowClassName={ZEBRA_ROWS}
          showPagination={false}
        />
      </TableCard>

      <TableCard title="Transaction Account" href="/wallet">
        <DataTable
          columns={TRANSACTION_ACCOUNT_COLUMNS}
          data={TRANSACTION_ACCOUNTS}
          getRowId={(row) => row.id}
          rowClassName={ZEBRA_ROWS}
          showPagination={false}
        />
      </TableCard>
    </div>
  );
}
