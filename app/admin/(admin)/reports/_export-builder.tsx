"use client";
import * as React from "react";

import { INVESTMENTS } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { reportExportFormSchema, statementRowSchema } from "@/constant/schemas/admin-reports";
import { printPreview } from "@/lib/print-preview";
import { previewCsv } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceDate, FinanceSelect, downloadCsv } from "../_operations/treasury-ui";
import { Notice, Panel } from "../_operations/ui";

type Row = z.infer<typeof statementRowSchema>;
const COLUMNS = ["reference", "date", "amount", "status", "issue", "owner"] as const;
export function ReportExportBuilder({ rows }: { rows: Row[] }) {
  const form = useForm<z.infer<typeof reportExportFormSchema>>({
    resolver: zodResolver(reportExportFormSchema),
    defaultValues: {
      dataset: "transactions",
      from: "2026-10-01",
      to: "2026-10-31",
      format: "csv",
      maskIdentifiers: true,
    },
  });
  const dataset = useWatch({ control: form.control, name: "dataset" });
  const [columns, setColumns] = React.useState<string[]>(["reference", "date", "amount", "status"]);
  const prepare = (v: z.infer<typeof reportExportFormSchema>) => {
    if (v.dataset !== "property" && !columns.length) {
      toast.error("Select at least one export column");
      return null;
    }
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
    const filtered = rows.filter(
      (r) => r.date >= v.from && r.date <= v.to && (v.dataset !== "exceptions" || r.status === "unmatched")
    );
    return { headers: columns, records: filtered as unknown as Record<string, string | number>[] };
  };
  return (
    <Panel title="Custom export builder">
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          const data = prepare(v);
          if (!data) return;
          const csvRows = [data.headers, ...data.records.map((r) => data.headers.map((key) => r[key] ?? ""))];
          if (v.format === "csv") downloadCsv("citycore-report-preview.csv", previewCsv(csvRows));
          else
            printPreview(
              "City Core report preview",
              csvRows.map((row) => row.join(" · "))
            );
        })}
      >
        <FinanceSelect
          form={form}
          name="dataset"
          label="Dataset"
          items={[
            { value: "transactions", label: "Transactions + reconciliation" },
            { value: "exceptions", label: "Unmatched exceptions" },
            { value: "property", label: "Property performance" },
          ]}
        />
        <FinanceDate form={form} name="from" label="Date range starts" />
        <FinanceDate form={form} name="to" label="Date range ends" />
        {dataset !== "property" && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Columns</legend>
            {COLUMNS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm capitalize">
                <Checkbox
                  checked={columns.includes(c)}
                  onCheckedChange={(checked) =>
                    setColumns((values) => (checked ? [...values, c] : values.filter((key) => key !== c)))
                  }
                />
                {c}
              </label>
            ))}
          </fieldset>
        )}
        <FinanceSelect
          form={form}
          name="format"
          label="Output format"
          items={[
            { value: "csv", label: "CSV" },
            { value: "pdf", label: "Print / Save PDF" },
          ]}
        />
        <label className="flex items-center gap-2 text-xs">
          <Checkbox checked disabled />
          Mask personal and bank identifiers
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((v) => {
              const data = prepare(v);
              if (!data) return;
              AppModal.open({
                title: `Export preview · ${data.records.length} rows`,
                content: (
                  <DataTable
                    pageSize={5}
                    data={data.records}
                    columns={data.headers.map((key) => ({ accessorKey: key, header: key }))}
                  />
                ),
              });
            })}
          >
            Preview export
          </Button>
          <Button type="submit">Generate export</Button>
        </div>
        <Notice>
          Finance reporting scope · approved columns only. CSV and print previews contain illustrative records, not
          certified financial statements.
        </Notice>
      </form>
    </Panel>
  );
}
