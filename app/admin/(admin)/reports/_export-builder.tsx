"use client";
import * as React from "react";

import { INVESTMENTS } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type StatementRow, reportExportFormSchema } from "@/constant/schemas/admin-reports";
import { printPreview } from "@/lib/print-preview";
import { previewCsv } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileExportIcon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceDate, downloadCsv } from "../_operations/treasury-ui";
import { FilterChips } from "../account/_ui";

type ExportForm = z.infer<typeof reportExportFormSchema>;
const COLUMNS = ["reference", "date", "amount", "status", "issue", "owner"] as const;
const DATASETS = [
  { value: "transactions", label: "Transactions", hint: "Every statement record with its match status" },
  { value: "exceptions", label: "Exceptions", hint: "Unmatched records awaiting investigation" },
  { value: "property", label: "Property performance", hint: "Allocation, principal and target ROI per offering" },
] as const;

function prepare(rows: StatementRow[], v: ExportForm, columns: string[]) {
  if (v.dataset === "property")
    return {
      headers: ["property", "units", "capacity", "principal", "target_roi"],
      records: INVESTMENTS.map((i) => ({
        property: i.name,
        units: i.allocatedUnits,
        capacity: i.totalUnits,
        principal: i.allocatedUnits * i.unitPrice,
        target_roi: `${i.annualRoi}% target, not guaranteed`,
      })) as Record<string, string | number>[],
    };
  const records = rows.filter(
    (r) => r.date >= v.from && r.date <= v.to && (v.dataset !== "exceptions" || r.status === "unmatched")
  );
  return { headers: columns, records: records as unknown as Record<string, string | number>[] };
}

export function ReportExportSheet({
  rows,
  open,
  onOpenChange,
}: {
  rows: StatementRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<ExportForm>({
    resolver: zodResolver(reportExportFormSchema),
    defaultValues: {
      dataset: "transactions",
      from: "2026-10-01",
      to: "2026-10-31",
      format: "csv",
      maskIdentifiers: true,
    },
  });
  const [columns, setColumns] = React.useState<string[]>(["reference", "date", "amount", "status"]);
  const values = useWatch({ control: form.control }) as ExportForm;
  const isProperty = values.dataset === "property";
  const count = prepare(rows, values, columns).records.length;

  const withData = (run: (data: ReturnType<typeof prepare>, v: ExportForm) => void) =>
    form.handleSubmit((v) => {
      if (!isProperty && !columns.length) {
        toast.error("Select at least one column");
        return;
      }
      run(prepare(rows, v, columns), v);
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="gap-2 border-b border-border p-6">
          <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
            <HugeiconsIcon icon={FileExportIcon} aria-hidden />
          </span>
          <SheetTitle className="text-base font-semibold">Build an export</SheetTitle>
          <SheetDescription>Finance reporting scope · approved columns only</SheetDescription>
        </SheetHeader>

        <form
          noValidate
          className="flex flex-col gap-6 p-6"
          onSubmit={withData((data, v) => {
            const csvRows = [data.headers, ...data.records.map((r) => data.headers.map((key) => r[key] ?? ""))];
            if (v.format === "csv") downloadCsv("citycore-report-preview.csv", previewCsv(csvRows));
            else
              printPreview(
                "City Core report preview",
                csvRows.map((row) => row.join(" · "))
              );
          })}
        >
          <Controller
            control={form.control}
            name="dataset"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-2 text-sm font-medium">Dataset</legend>
                {DATASETS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option.value}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      field.value === option.value ? "border-foreground/30 bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border",
                        field.value === option.value ? "border-foreground" : "border-border"
                      )}
                    >
                      {field.value === option.value && <span className="size-2 rounded-full bg-foreground" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    </span>
                  </button>
                ))}
              </fieldset>
            )}
          />

          {!isProperty && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FinanceDate form={form} name="from" label="From" />
                <FinanceDate form={form} name="to" label="To" />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Columns</legend>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMNS.map((c) => {
                    const on = columns.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setColumns((list) => (on ? list.filter((k) => k !== c) : [...list, c]))}
                        className={cn(
                          "h-8 rounded-full border px-3 text-xs capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on
                            ? "border-foreground bg-foreground font-semibold text-background"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">Format</span>
            <Controller
              control={form.control}
              name="format"
              render={({ field }) => (
                <FilterChips
                  label="Format"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "csv", label: "CSV" },
                    { value: "pdf", label: "Print / PDF" },
                  ]}
                />
              )}
            />
          </div>

          <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3.5 shrink-0" />
            Personal and bank identifiers are always masked.
          </p>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{count.toLocaleString()}</span> rows ·{" "}
              {isProperty ? 5 : columns.length} columns
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-full"
                onClick={withData((data) =>
                  AppModal.open({
                    title: `Export preview · ${data.records.length} rows`,
                    content: (
                      <DataTable
                        pageSize={5}
                        data={data.records}
                        columns={data.headers.map((key) => ({ accessorKey: key, header: key }))}
                      />
                    ),
                  })
                )}
              >
                Preview
              </Button>
              <Button type="submit" className="h-10 flex-1 rounded-full" disabled={!count}>
                Generate export
              </Button>
            </div>
            <p className="text-xs/5 text-muted-foreground">Illustrative records, not certified financial statements.</p>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
