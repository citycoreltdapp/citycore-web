"use client";
import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type MatrixChange, type PlatformState, platformMatrixChangeSchema } from "@/constant/schemas/admin-platform";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FinanceNumber, money } from "../_operations/treasury-ui";
import { StatusPill } from "../account/_ui";
import { CardHeader } from "../content/_ui";
import { PLATFORM_DEFAULTS } from "./_data";

type Row = PlatformState["matrix"][number];
type EditableRow = Row & { perTransaction: number; dailyLimit: number };

const isEditable = (row: Row): row is EditableRow => row.perTransaction !== null && row.dailyLimit !== null;
export const isEdited = (row: Row) => {
  const base = PLATFORM_DEFAULTS.matrix.find((r) => r.operation === row.operation);
  return (
    !!base && (base.fee !== row.fee || base.perTransaction !== row.perTransaction || base.dailyLimit !== row.dailyLimit)
  );
};
const toChange = (row: EditableRow): MatrixChange => ({
  operation: row.operation as MatrixChange["operation"],
  fee: row.fee,
  perTransaction: row.perTransaction,
  dailyLimit: row.dailyLimit,
});

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "label",
    enableSorting: false,
    header: "Operation",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          {row.original.label}
          {isEdited(row.original) && <StatusPill tone="warning">Edited</StatusPill>}
        </p>
        <p className="text-xs">{row.original.eligibility}</p>
      </div>
    ),
  },
  {
    accessorKey: "fee",
    enableSorting: false,
    header: () => <span className="block text-right">Fee</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold text-foreground tabular-nums">
        {row.original.fee ? money(row.original.fee) : "Free"}
      </span>
    ),
  },
  {
    accessorKey: "perTransaction",
    enableSorting: false,
    header: () => <span className="block text-right">Per transaction</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.perTransaction === null ? "Available units" : money(row.original.perTransaction)}
      </span>
    ),
  },
  {
    accessorKey: "dailyLimit",
    enableSorting: false,
    header: () => <span className="block text-right">Daily limit</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.dailyLimit === null ? "Wallet balance" : money(row.original.dailyLimit)}
      </span>
    ),
  },
];

function EditForm({ row, onApply }: { row: EditableRow; onApply: (change: MatrixChange) => void }) {
  const form = useForm<MatrixChange>({
    resolver: zodResolver(platformMatrixChangeSchema),
    defaultValues: toChange(row),
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(onApply)} className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="text-muted-foreground">Editing</span> <span className="font-semibold">{row.label}</span>
        </p>
        {isEdited(row) && <span className="text-xs text-warning">Changed from the live configuration</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FinanceNumber form={form} name="fee" label="Flat fee" prefix="₦" />
        <FinanceNumber form={form} name="perTransaction" label="Per transaction" prefix="₦" />
        <FinanceNumber form={form} name="dailyLimit" label="Daily limit" prefix="₦" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs/5 text-muted-foreground">
          The strictest of tier, balance and global limit applies. High-value withdrawals still go through treasury
          approval.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-9 rounded-full px-3.5" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" variant="outline" className="h-9 rounded-full px-4">
            Apply to draft
          </Button>
        </div>
      </div>
    </form>
  );
}

export function FeeMatrix({ matrix, onChange }: { matrix: Row[]; onChange: (matrix: Row[]) => void }) {
  const [selected, setSelected] = React.useState("withdrawal");
  const row = matrix.find((r) => r.operation === selected);
  const edited = matrix.filter(isEdited).length;

  return (
    <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader
        title="Fees & limits"
        note={`NGN · ${edited ? `${edited} change${edited === 1 ? "" : "s"} in draft` : "matches live configuration"} · select a row to edit`}
      />
      <DataTable
        columns={columns}
        data={matrix}
        getRowId={(r) => r.operation}
        showPagination={false}
        onRowClick={(r) => {
          if (isEditable(r)) setSelected(r.operation);
          else toast.info(`${r.label} is limited by available units, not a fixed amount`);
        }}
        rowClassName="border-none even:bg-muted/50 hover:bg-muted"
      />
      {row && isEditable(row) && (
        <EditForm
          key={`${row.operation}-${row.fee}-${row.perTransaction}-${row.dailyLimit}`}
          row={row}
          onApply={(change) => {
            onChange(matrix.map((r) => (r.operation === change.operation ? { ...r, ...change } : r)));
            toast.success(`${row.label} updated in the draft`);
          }}
        />
      )}
    </Card>
  );
}
