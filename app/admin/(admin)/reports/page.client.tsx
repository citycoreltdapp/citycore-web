"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { DateField } from "@/components/primitives/date-field";
import { FileUpload } from "@/components/primitives/file-upload";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type StatementRow, statementFileSchema } from "@/constant/schemas/admin-reports";
import { parseStatementCsv, reconciliationTotals } from "@/lib/statement-preview";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  FileExportIcon,
  FileImportIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { toast } from "sonner";

import { useReviewRequests } from "../_operations/requests";
import { downloadCsv, money } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { REPORT_ROWS } from "../_operations/workspace-data";
import { FilterChips, StatusPill, type Tone, formatDate } from "../account/_ui";
import { PropertyAnalytics, TaxAnalytics } from "./_analytics";
import { ReportExportSheet } from "./_export-builder";
import { ReconciliationSheet } from "./_reconciliation-sheet";

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

export function ReportsPage() {
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
