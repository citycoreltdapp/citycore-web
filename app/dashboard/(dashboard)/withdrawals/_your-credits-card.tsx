"use client";

import * as React from "react";

import { DataTable, type TableAction } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { toast } from "sonner";

import { CREDITS, type Credit, type CreditStatus } from "./_data";

const STATUS_STYLES: Record<CreditStatus, string> = {
  Active: "border-transparent bg-muted text-foreground",
  Pause: "border-transparent bg-warning/15 text-warning",
  Cancel: "border-destructive/25 bg-destructive/5 text-destructive",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "balance", label: "Highest balance" },
];

const formatBalance = (balance: number) =>
  `₦${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TwoLineCell({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-foreground">{primary}</span>
      <span className="text-xs">{secondary}</span>
    </div>
  );
}

const COLUMNS: ColumnDef<Credit, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: false,
    cell: ({ row }) => <TwoLineCell primary={row.original.title} secondary={row.original.card} />,
  },
  {
    accessorKey: "detail",
    header: "Date & Time",
    enableSorting: false,
    cell: ({ row }) => <TwoLineCell primary={row.original.detail} secondary={row.original.detailNote} />,
  },
  {
    accessorKey: "balance",
    header: "Account Balance",
    enableSorting: false,
    cell: ({ row }) => <span className="text-foreground tabular-nums">{formatBalance(row.original.balance)}</span>,
  },
  {
    accessorKey: "interest",
    header: "Account Interest",
    enableSorting: false,
    cell: ({ row }) => <span className="text-foreground tabular-nums">{row.original.interest}</span>,
  },
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

export function YourCreditsCard() {
  const [credits, setCredits] = React.useState(CREDITS);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState(SORT_OPTIONS[0].value);

  const actions = React.useMemo<TableAction<Credit>[]>(() => {
    // ponytail: only changes the mock row in this tab. Call the credit API here once the backend exists.
    const setStatus = (credit: Credit, status: CreditStatus, message: string) => {
      setCredits((current) => current.map((item) => (item.key === credit.key ? { ...item, status } : item)));
      toast.success(`${credit.title} ${message}.`);
    };

    return [
      {
        label: "Pause",
        when: (credit) => credit.status === "Active",
        onClick: (credit) => setStatus(credit, "Pause", "paused"),
      },
      {
        label: "Resume",
        when: (credit) => credit.status === "Pause",
        onClick: (credit) => setStatus(credit, "Active", "resumed"),
      },
      {
        label: "Cancel",
        variant: "destructive",
        when: (credit) => credit.status !== "Cancel",
        onClick: (credit) => setStatus(credit, "Cancel", "cancelled"),
      },
    ];
  }, []);

  const term = search.trim().toLowerCase();
  const matching = credits.filter(
    (credit) => !term || `${credit.title} ${credit.card} ${credit.status}`.toLowerCase().includes(term)
  );
  const rows =
    sort === "oldest"
      ? matching.toReversed()
      : sort === "balance"
        ? matching.toSorted((a, b) => b.balance - a.balance)
        : matching;

  return (
    <Card className="rounded-2xl ring-foreground/8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 pb-4">
        <CardTitle className="text-lg font-semibold">Your Credits</CardTitle>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <SearchField
            id="your-credits-search"
            aria-label="Search credits"
            className="w-full sm:w-64"
            groupClassName="rounded-full border-none bg-muted dark:bg-muted"
            buttonClassName="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            value={search}
            onChange={setSearch}
            onSearch={setSearch}
          />
          <SelectField
            id="your-credits-sort"
            label="Sort By :"
            value={sort}
            onChange={setSort}
            items={SORT_OPTIONS}
            className="flex-row items-center"
            labelClassName="font-normal whitespace-nowrap text-muted-foreground"
            triggerClassName="h-10! min-w-24 rounded-full px-3.5"
            contentClassName="min-w-40"
          />
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <DataTable
          columns={COLUMNS}
          data={rows}
          pageSize={8}
          enableBulkSelect
          actions={actions}
          actionsHeader="Action"
          getRowId={(credit) => credit.key}
          rowClassName="border-none even:[&>td]:bg-muted"
          emptyMessage="No credits match your search."
        />
      </CardContent>
    </Card>
  );
}
