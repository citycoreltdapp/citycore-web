"use client";

import * as React from "react";

import { PROPERTIES, coverImage } from "@/app/dashboard/(dashboard)/marketplace/page";
import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { DateField } from "@/components/primitives/date-field";
import { FileUpload } from "@/components/primitives/file-upload";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  type StatementRow,
  reconciliationFormSchema,
  reportExportFormSchema,
  statementFileSchema,
} from "@/constant/schemas/admin-reports";
import { printPreview } from "@/lib/print-preview";
import { parseStatementCsv, reconciliationTotals } from "@/lib/statement-preview";
import { previewCsv } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDataTransferHorizontalIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download04Icon,
  FileExportIcon,
  FileImportIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceDate, FinanceSelect, FinanceText, downloadCsv, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { REPORT_ROWS } from "../_operations/workspace-data";
import { FilterChips, SegmentBar, StatusPill, type Tone, formatDate } from "../account/page";

function PropertyAnalytics() {
  const principal = PROPERTIES.reduce((sum, i) => sum + i.unitsSold * i.unitPrice, 0);
  const allocated = PROPERTIES.reduce((sum, i) => sum + i.unitsSold, 0);
  const capacity = PROPERTIES.reduce((sum, i) => sum + i.totalUnits, 0);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
        <div>
          <h2 className="text-base font-semibold">Offering performance</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Subscribed principal and allocation · {PROPERTIES.length} properties
          </p>
        </div>
        <DataTable
          data={PROPERTIES}
          pageSize={8}
          showPagination={false}
          cellClassName="py-4"
          columns={[
            {
              accessorKey: "name",
              header: "Property",
              cell: ({ row }) => (
                <Link
                  href={`/admin/investments/${row.original.id}`}
                  className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src={coverImage(row.original)}
                    width={44}
                    height={44}
                    alt=""
                    className="size-11 rounded-xl object-cover"
                  />
                  <span>
                    <span className="block font-semibold text-foreground group-hover:underline">
                      {row.original.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.original.location}</span>
                  </span>
                </Link>
              ),
            },
            {
              id: "allocation",
              header: "Allocation",
              cell: ({ row }) => (
                <div className="min-w-28 space-y-2">
                  <p className="text-xs tabular-nums">
                    {row.original.unitsSold.toLocaleString()} / {row.original.totalUnits.toLocaleString()} units
                  </p>
                  <SegmentBar
                    className="h-1.5 bg-muted"
                    parts={[
                      { key: "allocated", value: row.original.unitsSold, className: "bg-accent" },
                      {
                        key: "available",
                        value: row.original.totalUnits - row.original.unitsSold,
                        className: "bg-muted",
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              id: "principal",
              header: "Principal",
              cell: ({ row }) => (
                <span className="font-semibold text-foreground tabular-nums">
                  {money(row.original.unitsSold * row.original.unitPrice)}
                </span>
              ),
            },
            {
              accessorKey: "targetRoi",
              header: "Target / year",
              cell: ({ row }) => <span className="tabular-nums">{row.original.targetRoi}%</span>,
            },
          ]}
        />
        <p className="border-t border-border pt-4 text-xs/5 text-muted-foreground">
          Target ROI describes offering assumptions, not realized performance. Returns are not guaranteed; capital is at
          risk.
        </p>
      </Card>
      <Card className="gap-6 rounded-2xl px-5 py-5 ring-foreground/8">
        <div>
          <h2 className="text-base font-semibold">Portfolio allocation</h2>
          <p className="mt-1 text-xs text-muted-foreground">Platform totals · current offering snapshot</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Subscribed principal</p>
          <p className="mt-2 text-3xl font-light break-words tabular-nums">{money(principal)}</p>
        </div>
        <div className="space-y-3">
          <SegmentBar
            className="h-2.5 bg-muted"
            parts={[
              { key: "allocated", value: allocated, className: "bg-accent" },
              { key: "available", value: capacity - allocated, className: "bg-muted" },
            ]}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round((allocated / capacity) * 100)}% allocated</span>
            <span>{(capacity - allocated).toLocaleString()} units available</span>
          </div>
        </div>
        <dl className="space-y-3 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Allocated units</dt>
            <dd className="font-semibold tabular-nums">{allocated.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total capacity</dt>
            <dd className="font-semibold tabular-nums">{capacity.toLocaleString()}</dd>
          </div>
        </dl>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/admin/investments" />}
          className="h-10 rounded-full"
        >
          Manage offerings
          <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden />
        </Button>
      </Card>
    </div>
  );
}
function TaxAnalytics() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="gap-6 rounded-2xl px-6 py-6 ring-foreground/8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Distribution breakdown</h2>
            <p className="mt-1 text-xs text-muted-foreground">October 2026 · DIV-010</p>
          </div>
          <StatusPill tone="muted">Illustrative schedule</StatusPill>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Gross distributions</p>
          <p className="mt-2 text-4xl font-light tabular-nums">{money(240000)}</p>
        </div>
        <SegmentBar
          className="h-3 bg-muted"
          parts={[
            { key: "net", value: 216000, className: "bg-accent" },
            { key: "tax", value: 24000, className: "bg-foreground/35" },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-accent" aria-hidden />
              Net wallet credits · 90%
            </p>
            <p className="text-2xl font-light tabular-nums">{money(216000)}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-foreground/35" aria-hidden />
              Example withholding · 10%
            </p>
            <p className="text-2xl font-light tabular-nums">{money(24000)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          <Button
            className="h-10 rounded-full px-4"
            onClick={() =>
              printPreview("Tax schedule preview", [
                "Batch: DIV-010 · October 2026",
                "Gross: ₦240,000",
                "Example withholding (10%): ₦24,000",
                "Net wallet credits: ₦216,000",
                "Illustrative only. Verify tax applicability before filing.",
              ])
            }
          >
            <HugeiconsIcon icon={Download04Icon} aria-hidden />
            Print / Save PDF
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/admin/returns" />}
            className="h-10 rounded-full px-4"
          >
            View distribution schedule
          </Button>
        </div>
      </Card>
      <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
        <div>
          <h2 className="text-base font-semibold">Before you file</h2>
          <p className="mt-1 text-xs text-muted-foreground">This schedule is a reporting preview.</p>
        </div>
        <ol className="space-y-5">
          {[
            "Verify the applicable tax rule and jurisdiction.",
            "Confirm the gross distribution and investor allocation.",
            "Obtain approval before filing or remitting tax.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <p className="text-sm/6 text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <p className="border-t border-border pt-4 text-xs/5 text-muted-foreground">
          No tax return is submitted from this page. The example 10% rate is not tax advice.
        </p>
      </Card>
    </div>
  );
}

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
      records: PROPERTIES.map((i) => ({
        property: i.name,
        units: i.unitsSold,
        capacity: i.totalUnits,
        principal: i.unitsSold * i.unitPrice,
        target_roi: `${i.targetRoi}% target, not guaranteed`,
      })) as Record<string, string | number>[],
    };
  const records = rows.filter(
    (r) => r.date >= v.from && r.date <= v.to && (v.dataset !== "exceptions" || r.status === "unmatched")
  );
  return { headers: columns, records: records as unknown as Record<string, string | number>[] };
}

function ReportExportSheet({
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

type Reviews = ReturnType<typeof useReviewRequests>;

function ReconciliationSheet({
  row,
  reviews,
  onClose,
}: {
  row: StatementRow | null;
  reviews: Reviews;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {row && <Investigation key={`${row.date}-${row.reference}`} row={row} reviews={reviews} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
function Investigation({
  row,
  reviews: { submit, ready, requests },
  onClose,
}: {
  row: StatementRow;
  reviews: Reviews;
  onClose: () => void;
}) {
  const form = useForm<z.infer<typeof reconciliationFormSchema>>({
    resolver: zodResolver(reconciliationFormSchema),
    defaultValues: {
      reference: row.reference,
      resolution: "query-original",
      note: "Awaiting provider settlement query; original reference retained.",
    },
  });
  const pending = requests.some((r) => r.kind === "reconciliation" && r.subjectId === row.reference);
  return (
    <>
      <SheetHeader className="gap-2 border-b border-border p-6">
        <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
          <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} aria-hidden />
        </span>
        <SheetTitle className="text-base font-semibold">
          {row.status === "unmatched" ? "Investigate exception" : "Statement record"}
        </SheetTitle>
        <SheetDescription>
          {row.reference} · {formatDate(row.date)}
        </SheetDescription>
        <p className="mt-2 text-3xl font-light tabular-nums">{money(row.amount)}</p>
        <div>
          <StatusPill tone={row.status === "matched" ? "success" : "warning"}>
            {row.status === "matched" ? "Matched" : "Needs review"}
          </StatusPill>
        </div>
      </SheetHeader>
      <div className="space-y-5 p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Assigned team</dt>
            <dd className="font-medium">{row.owner}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Direction</dt>
            <dd className="font-medium">{row.amount < 0 ? "Debit" : "Credit"}</dd>
          </div>
        </dl>
        {row.issue && <p className="rounded-xl bg-warning/10 p-4 text-sm/6 text-warning">{row.issue}</p>}
        {row.status === "unmatched" ? (
          <form
            noValidate
            className="space-y-5"
            onSubmit={form.handleSubmit((v) => {
              if (
                submit({
                  kind: "reconciliation",
                  subjectId: row.reference,
                  summary: `Investigation · ${v.resolution}`,
                  reason: v.note,
                  details: { ...v, date: row.date },
                })
              )
                onClose();
            })}
          >
            <FinanceSelect
              form={form}
              name="resolution"
              label="Next action"
              items={[
                { value: "query-original", label: "Query original status" },
                { value: "missing-source", label: "Investigate missing source" },
                { value: "request-adjustment", label: "Request ledger adjustment" },
              ]}
            />
            <FinanceText form={form} name="note" label="Evidence & investigation note" area />
            {pending && (
              <p role="status" className="text-xs text-warning">
                An investigation request is already awaiting review.
              </p>
            )}
            <Button type="submit" disabled={!ready || pending} className="h-10 w-full rounded-full">
              {pending ? "Investigation saved" : "Save investigation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-full"
              disabled={!ready}
              onClick={form.handleSubmit((v) => {
                onClose();
                reviewBatch({
                  title: "Request adjustment approval",
                  batchId: row.reference,
                  content: (
                    <Notice>
                      Reference {row.reference} · {formatDate(row.date)}. No automatic balancing entry is created.
                    </Notice>
                  ),
                  onSave: (r) =>
                    submit({
                      kind: "report-adjustment",
                      subjectId: row.reference,
                      summary: "Reconciliation adjustment review",
                      reason: v.note,
                      details: { ...v, date: row.date, checkerId: r.checkerId, reviewReason: r.reason },
                    }),
                });
              })}
            >
              Request adjustment approval
            </Button>
            <p className="text-xs/5 text-muted-foreground">
              Saved as a local review request. No ledger entry is posted and the exception stays open until verified.
            </p>
          </form>
        ) : (
          <Notice>
            The statement reference and amount match the sample ledger for this date. This preview does not certify
            settlement or an EOD close.
          </Notice>
        )}
        <Button
          variant="ghost"
          className="w-full rounded-full"
          onClick={() =>
            navigator.clipboard
              .writeText(row.reference)
              .then(() => toast.success("Reference copied"))
              .catch(() => toast.error("Clipboard access is unavailable"))
          }
        >
          <HugeiconsIcon icon={Copy01Icon} aria-hidden />
          Copy reference
        </Button>
      </div>
    </>
  );
}

type View = "reconciliation" | "property" | "tax";
type StatusFilter = "all" | StatementRow["status"];
const REQUEST_KINDS = ["reconciliation", "report-adjustment"];
const LEDGER = new Map(REPORT_ROWS.filter((r) => r.status === "matched").map((r) => [r.reference, r.amount]));

const columns: ColumnDef<StatementRow>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            row.original.status === "matched" ? "bg-success" : "bg-warning"
          )}
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground tabular-nums">{row.original.reference}</p>
          {row.original.issue && <p className="truncate text-xs text-warning">{row.original.issue}</p>}
        </div>
      </div>
    ),
  },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "amount",
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold whitespace-nowrap text-foreground tabular-nums">
        {money(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "matched" ? (
        <StatusPill tone="success">Matched</StatusPill>
      ) : (
        <StatusPill tone="warning">Needs review</StatusPill>
      ),
  },
];

function CardHeader({ title, note, children }: { title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function MatchSummary({ rows, day, onRun }: { rows: StatementRow[]; day: string; onRun: () => void }) {
  const totals = reconciliationTotals(rows);
  const exceptions = rows.filter((r) => r.status === "unmatched");
  const rate = totals.total ? (totals.matched / totals.total) * 100 : 0;

  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Match rate · {formatDate(day)}</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">
            {rows.length ? `${rate.toFixed(rate % 1 ? 1 : 0)}%` : "—"}
          </p>
          <p className="mt-2 text-xs text-white/50 tabular-nums">
            {money(totals.matched)} of {money(totals.total)} matched to the City Core ledger
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          <span aria-hidden className={cn("size-1.5 rounded-full", exceptions.length ? "bg-white" : "bg-accent")} />
          {exceptions.length ? "EOD close blocked" : rows.length ? "Ready for checker" : "No records"}
        </span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <div aria-hidden className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/10">
          {totals.matched > 0 && (
            <span className="h-full rounded-full bg-accent" style={{ flexGrow: totals.matched }} />
          )}
          {totals.unmatched > 0 && (
            <span className="h-full min-w-1.5 rounded-full bg-white/40" style={{ flexGrow: totals.unmatched }} />
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            <span className="text-white/60">Matched</span>
            <span className="font-semibold tabular-nums">{money(totals.matched)}</span>
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-white/40" />
            <span className="text-white/60">Unmatched</span>
            <span className="font-semibold tabular-nums">{money(totals.unmatched)}</span>
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
        <dl className="grid flex-1 grid-cols-3 gap-4">
          {[
            { label: "Records", value: rows.length.toLocaleString(), note: "on the statement" },
            { label: "Exceptions", value: exceptions.length, note: "need investigation" },
            { label: "Statement total", value: money(totals.total), note: "absolute value" },
          ].map(({ label, value, note }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-white/60">{label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
              <dd className="truncate text-xs text-white/50">{note}</dd>
            </div>
          ))}
        </dl>
        <Button
          className="h-10 rounded-full bg-white px-4 text-[#121212] hover:bg-white/90"
          disabled={!rows.length}
          onClick={onRun}
        >
          Run matching
        </Button>
      </div>
    </section>
  );
}

function SourcesCard({ rows }: { rows: StatementRow[] }) {
  const exceptions = rows.filter((r) => r.status === "unmatched").length;
  const sources: { name: string; note: string; tone: Tone; status: string }[] = [
    { name: "Bank statement", note: `${rows.length} records imported`, tone: "success", status: "Imported" },
    {
      name: "Gateway ledger",
      note: exceptions ? `${exceptions} reference${exceptions === 1 ? "" : "s"} differ` : "All references agree",
      tone: exceptions ? "warning" : "success",
      status: exceptions ? "Differences" : "Agrees",
    },
    { name: "City Core ledger", note: "Reference ledger for matching", tone: "success", status: "Reference" },
    { name: "Symplus", note: "Integration not configured", tone: "muted", status: "Not compared" },
  ];
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Sources" note="A three-way close needs every source compared" />
      <ul className="flex flex-col">
        {sources.map((s) => (
          <li key={s.name} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{s.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.note}</span>
            </span>
            <StatusPill tone={s.tone}>{s.status}</StatusPill>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
        <Button className="h-10 rounded-full" disabled>
          <HugeiconsIcon icon={LockIcon} aria-hidden />
          Approve EOD close
        </Button>
        <p className="text-xs/5 text-muted-foreground">
          Locked until every exception is resolved, Symplus is compared and an independent checker signs off.
        </p>
      </div>
    </Card>
  );
}

function ExceptionQueue({
  rows,
  pendingIds,
  onOpen,
}: {
  rows: StatementRow[];
  pendingIds: Set<string>;
  onOpen: (row: StatementRow) => void;
}) {
  const exceptions = rows.filter((r) => r.status === "unmatched");
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Exceptions" note="No automatic balancing entries">
        {exceptions.length > 0 && <StatusPill tone="warning">{exceptions.length} open</StatusPill>}
      </CardHeader>
      {exceptions.length ? (
        <ul className="flex flex-col gap-1">
          {exceptions.map((r) => (
            <li key={r.reference}>
              <button
                type="button"
                onClick={() => onOpen(r)}
                className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-warning" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums">{r.reference}</span>
                    <span className="text-sm font-semibold tabular-nums">{money(r.amount)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{r.issue}</span>
                  <span className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{r.owner}</span>
                    {pendingIds.has(r.reference) && <span className="text-warning">Investigation pending</span>}
                  </span>
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-success/12 text-success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-5" />
          </span>
          <p className="text-sm font-semibold">Nothing to investigate</p>
          <p className="text-xs text-muted-foreground">Every record on this statement matches the ledger.</p>
        </div>
      )}
    </Card>
  );
}

export default function ReportsPage() {
  const reviews = useReviewRequests();
  const { requests } = reviews;
  const [view, setView] = React.useState<View>("reconciliation");
  const [rows, setRows] = React.useState<StatementRow[]>(REPORT_ROWS);
  const [day, setDay] = React.useState("2026-10-21");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<StatementRow | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const dayRows = rows.filter((r) => r.date === day);
  const term = search.trim().toLowerCase();
  const tableRows = dayRows
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => !term || `${r.reference} ${r.issue} ${r.owner}`.toLowerCase().includes(term))
    .toSorted((a, b) => (a.status === b.status ? 0 : a.status === "unmatched" ? -1 : 1));
  const countOf = (value: StatusFilter) => dayRows.filter((r) => value === "all" || r.status === value).length;
  const openRequests = requests.filter((r) => REQUEST_KINDS.includes(r.kind));
  const pendingIds = new Set(openRequests.filter((r) => r.kind === "reconciliation").map((r) => r.subjectId));

  const runMatching = () => {
    setRows((current) =>
      current.map((r) => {
        const matched = LEDGER.get(r.reference) === r.amount;
        return {
          ...r,
          status: matched ? "matched" : "unmatched",
          issue: matched ? "" : r.issue || "No matching local ledger reference",
        };
      })
    );
    toast.info("Illustrative matching complete · no EOD close certified");
  };

  const importStatement = () =>
    AppModal.open({
      title: "Import a statement",
      description: "Bank or gateway CSV · reference, date, amount",
      content: (
        <div className="space-y-4">
          <FileUpload
            id="report-import"
            label="CSV statement"
            dropzoneAccept={{ "text/csv": [".csv"] }}
            dropzoneMaxSize={2 * 1024 * 1024}
            onFilesRejected={() => toast.error("Use a CSV file up to 2 MB")}
            onFilesAdded={async (files) => {
              const result = statementFileSchema.safeParse(files[0]);
              if (!result.success) {
                toast.error(result.error.issues[0].message);
                return;
              }
              try {
                const imported = parseStatementCsv(await result.data.text());
                setRows(imported);
                setDay(imported[0].date);
                setStatus("all");
                toast.success(`${imported.length} statement rows loaded in this session`);
                AppModal.close();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Invalid statement CSV");
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs/5 text-muted-foreground">Up to 2 MB or 2,000 rows. Stays in this browser session.</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() =>
                downloadCsv("statement-template.csv", "reference,date,amount\r\nCC-1031,2026-10-21,200000.00")
              }
            >
              Template
            </Button>
          </div>
        </div>
      ),
    });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Reconciliation, offering performance and tax schedules · illustrative data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 rounded-full px-4" onClick={importStatement}>
            <HugeiconsIcon icon={FileImportIcon} aria-hidden />
            Import statement
          </Button>
          <Button className="h-10 rounded-full px-4" onClick={() => setExporting(true)}>
            <HugeiconsIcon icon={FileExportIcon} aria-hidden />
            Export
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Report"
          value={view}
          onChange={setView}
          options={[
            { value: "reconciliation", label: "Reconciliation", count: countOf("unmatched") || undefined },
            { value: "property", label: "Property performance" },
            { value: "tax", label: "Tax & withholding" },
          ]}
        />
        {view === "reconciliation" && (
          <DateField
            id="report-day"
            label="EOD date"
            labelClassName="sr-only"
            value={day}
            onChange={setDay}
            className="w-44"
            triggerClassName="h-9 rounded-full bg-card px-3.5"
          />
        )}
      </div>

      {view === "property" && <PropertyAnalytics />}
      {view === "tax" && <TaxAnalytics />}
      {view === "reconciliation" && (
        <>
          <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <MatchSummary rows={dayRows} day={day} onRun={runMatching} />
            <SourcesCard rows={dayRows} />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
              <CardHeader
                title="Statement records"
                note={`${tableRows.length} of ${dayRows.length} shown · select a row for details`}
              />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <FilterChips
                  label="Match status"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "all", label: "All", count: countOf("all") },
                    { value: "matched", label: "Matched", count: countOf("matched") },
                    { value: "unmatched", label: "Exceptions", count: countOf("unmatched") },
                  ]}
                />
                <SearchField
                  id="report-search"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search reference, issue or owner"
                  className="min-w-0 flex-1 lg:ml-auto lg:max-w-72"
                  groupClassName="h-9 bg-card dark:bg-card"
                />
              </div>
              <DataTable
                key={`${day}-${status}-${search}`}
                columns={columns}
                data={tableRows}
                getRowId={(r) => r.reference}
                pageSize={10}
                onRowClick={setSelected}
                rowClassName="border-none even:bg-muted/50 hover:bg-muted"
                emptyMessage={
                  dayRows.length ? "No records match these filters." : "No statement records for this date."
                }
              />
            </Card>

            <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-24">
              <ExceptionQueue rows={dayRows} pendingIds={pendingIds} onOpen={setSelected} />
              <Notice>
                Matching here is a preview against sample ledger data. It doesn&apos;t post entries or certify a close.
              </Notice>
            </div>
          </div>

          {openRequests.length > 0 && (
            <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
              <CardHeader title="Open requests" note="Saved in this browser · no ledger entry was posted" />
              <ul className="flex flex-col">
                {openRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {r.subjectId} · {r.summary}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{r.reason}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatDate(r.createdAt)}</span>
                    <StatusPill tone="warning">Pending review</StatusPill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <ReconciliationSheet row={selected} reviews={reviews} onClose={() => setSelected(null)} />
      <ReportExportSheet rows={rows} open={exporting} onOpenChange={setExporting} />
    </>
  );
}
