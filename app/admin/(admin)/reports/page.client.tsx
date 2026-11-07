"use client";
import * as React from "react";

import { INVESTMENTS } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { DateField } from "@/components/primitives/date-field";
import { FileUpload } from "@/components/primitives/file-upload";
import { Button } from "@/components/ui/button";
import { reconciliationFormSchema, statementFileSchema, statementRowSchema } from "@/constant/schemas/admin-reports";
import { printPreview } from "@/lib/print-preview";
import { parseStatementCsv, reconciliationTotals } from "@/lib/statement-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceSelect, FinanceText, TreasuryStats, downloadCsv, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice, PageLink, PageTitle, Panel, StatusBadge } from "../_operations/ui";
import { REPORT_ROWS } from "../_operations/workspace-data";
import { ReportExportBuilder } from "./_export-builder";

type Row = z.infer<typeof statementRowSchema>;
export function ReportsPage() {
  const [rows, setRows] = React.useState<Row[]>(REPORT_ROWS);
  const [day, setDay] = React.useState("2026-10-21");
  const { submit, ready } = useReviewRequests();
  const filtered = rows.filter((r) => r.date === day);
  const totals = reconciliationTotals(filtered);
  const exceptions = filtered.filter((r) => r.status === "unmatched");
  const form = useForm({
    resolver: zodResolver(reconciliationFormSchema),
    defaultValues: {
      reference: "CC-1031",
      resolution: "query-original" as const,
      note: "Awaiting provider settlement query; original reference retained.",
    },
  });
  const importStatement = () =>
    AppModal.open({
      title: "Import bank / gateway statement",
      content: (
        <div className="space-y-4">
          <Notice>
            Preview CSV template: reference,date,amount. Maximum 2 MB / 2,000 rows. Imported records stay in this
            browser session. No provider is contacted.
          </Notice>
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("statement-template.csv", "reference,date,amount\r\nCC-1031,2026-10-21,200000.00")
            }
          >
            Download CSV template
          </Button>
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
                form.setValue("reference", imported[0].reference);
                toast.success(`${imported.length} statement rows loaded in this session`);
                AppModal.close();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Invalid statement CSV");
              }
            }}
          />
        </div>
      ),
    });
  return (
    <>
      <PageTitle
        title="Reports & Financial Reconciliation"
        description="End-of-day matching, exception handling and scoped financial reporting."
      >
        <PageLink href="/withdrawals">Treasury</PageLink>
        <PageLink href="/platform/banking">Banking configuration</PageLink>
      </PageTitle>
      <div className="flex flex-wrap items-end gap-3">
        <DateField id="report-day" label="EOD date" value={day} onChange={setDay} />
        <Button variant="outline" onClick={importStatement}>
          Import bank / gateway statement
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const ledger = new Map(
              REPORT_ROWS.filter((r) => r.status === "matched").map((r) => [r.reference, r.amount])
            );
            setRows((current) =>
              current.map((r) => ({
                ...r,
                status: ledger.get(r.reference) === r.amount ? "matched" : "unmatched",
                issue: ledger.get(r.reference) === r.amount ? "" : r.issue || "No matching local ledger reference",
              }))
            );
            toast.info("Illustrative matching complete; no EOD close certified");
          }}
        >
          Run reconciliation preview
        </Button>
      </div>
      <TreasuryStats
        items={[
          { title: "Statement total", value: money(totals.total), note: `${filtered.length} imported records` },
          {
            title: "Matched",
            value: money(totals.matched),
            note: `${filtered.filter((r) => r.status === "matched").length} matched records`,
          },
          {
            title: "Unmatched",
            value: money(totals.unmatched),
            note: `${exceptions.length} exceptions · close blocked`,
          },
        ]}
      />
      <Panel
        title="EOD reconciliation sources"
        description="Same ledger scope per source · do not add repeated matched totals"
      >
        <DataTable
          showPagination={false}
          data={["Bank statement", "Gateway ledger", "Symplus", "City Core ledger"].map((source) => ({
            source,
            imported: source === "Symplus" ? "No import" : money(totals.total),
            matched: source === "Symplus" ? "Not compared" : money(totals.matched),
            unmatched: source === "Symplus" ? "Not calculated" : money(totals.unmatched),
            result: source === "Symplus" ? "Unconfigured" : exceptions.length ? "Review exceptions" : "Preview matched",
          }))}
          columns={[
            { accessorKey: "source", header: "Source" },
            { accessorKey: "imported", header: "Imported" },
            { accessorKey: "matched", header: "Matched" },
            { accessorKey: "unmatched", header: "Unmatched" },
            { accessorKey: "result", header: "Result" },
          ]}
        />
        <Notice>
          Symplus is unconfigured; a full three-way close cannot be certified. Resolve exceptions and complete
          missing-source review before requesting EOD approval.
        </Notice>
      </Panel>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Panel title="Exception handling" description="No automatic balancing entries">
            <DataTable
              showPagination={false}
              data={exceptions}
              onRowClick={(r) => form.setValue("reference", r.reference)}
              columns={[
                { accessorKey: "reference", header: "Reference" },
                { accessorKey: "amount", header: "Amount", cell: ({ row }) => money(row.original.amount) },
                { accessorKey: "issue", header: "Issue" },
                { accessorKey: "owner", header: "Owner" },
              ]}
            />
            <form
              noValidate
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => {
                if (!exceptions.some((r) => r.reference === v.reference)) {
                  form.setError("reference", { message: "Select an exception in this EOD run" });
                  return;
                }
                submit({
                  kind: "reconciliation",
                  subjectId: v.reference,
                  summary: `Investigation · ${v.resolution}`,
                  reason: v.note,
                  details: { ...v, date: day },
                });
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FinanceSelect
                  form={form}
                  name="reference"
                  label="Selected exception"
                  items={exceptions.map((r) => ({ value: r.reference, label: `${r.reference} · ${money(r.amount)}` }))}
                />
                <FinanceSelect
                  form={form}
                  name="resolution"
                  label="Resolution type"
                  items={[
                    { value: "query-original", label: "Query original status" },
                    { value: "missing-source", label: "Missing source investigation" },
                    { value: "request-adjustment", label: "Request ledger adjustment" },
                  ]}
                />
              </div>
              <FinanceText form={form} name="note" label="Evidence / recorded note" area />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="outline" disabled={!ready || !exceptions.length}>
                  Save investigation
                </Button>
                <Button
                  type="button"
                  disabled={!ready || !exceptions.length}
                  onClick={form.handleSubmit((v) =>
                    reviewBatch({
                      title: "Request adjustment approval",
                      batchId: v.reference,
                      content: <Notice>Reference {v.reference}. No automatic balancing entry is created.</Notice>,
                      onSave: (r) =>
                        submit({
                          kind: "report-adjustment",
                          subjectId: v.reference,
                          summary: "Reconciliation adjustment review",
                          reason: v.note,
                          details: { ...v, checkerId: r.checkerId },
                        }),
                    })
                  )}
                >
                  Request adjustment approval
                </Button>
                <Button disabled>Approve EOD close</Button>
              </div>
            </form>
          </Panel>
          <Panel
            title="Property performance analytics"
            description="Subscribed principal and offering progress · platform totals"
          >
            <DataTable
              data={INVESTMENTS.slice(0, 3)}
              showPagination={false}
              columns={[
                { accessorKey: "name", header: "Property" },
                {
                  id: "units",
                  header: "Units / capacity",
                  cell: ({ row }) => `${row.original.allocatedUnits} / ${row.original.totalUnits}`,
                },
                {
                  id: "principal",
                  header: "Principal",
                  cell: ({ row }) => money(row.original.allocatedUnits * row.original.unitPrice),
                },
                {
                  accessorKey: "annualRoi",
                  header: "Target annual ROI",
                  cell: ({ row }) => `${row.original.annualRoi}% · not guaranteed`,
                },
              ]}
            />
            <Notice>
              Targets describe offering assumptions, not realized performance. An investor’s personal yield is not a
              platform annual return.
            </Notice>
            <Button
              variant="outline"
              onClick={() =>
                AppModal.open({
                  title: "Detailed property report",
                  content: (
                    <DataTable
                      data={INVESTMENTS}
                      pageSize={5}
                      columns={[
                        { accessorKey: "name", header: "Property" },
                        { accessorKey: "location", header: "Location" },
                        { accessorKey: "allocatedUnits", header: "Allocated units" },
                        { accessorKey: "annualRoi", header: "Target ROI (%)" },
                      ]}
                    />
                  ),
                })
              }
            >
              Open detailed property report
            </Button>
          </Panel>
        </div>
        <aside className="space-y-5">
          <Panel title="Tax & withholding report" description="DIV-010 preview · illustrative 10% rule">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt>Gross distributions</dt>
              <dd>{money(240000)}</dd>
              <dt>Withholding</dt>
              <dd>{money(24000)}</dd>
              <dt>Net wallet credits</dt>
              <dd>{money(216000)}</dd>
              <dt>Reporting period</dt>
              <dd>October 2026</dd>
            </dl>
            <Button
              variant="outline"
              onClick={() =>
                AppModal.open({
                  title: "Tax schedule preview",
                  content: (
                    <Notice>
                      Gross ₦240,000 · illustrative withholding ₦24,000 · net ₦216,000. Verify the applicable tax rule
                      and jurisdiction before filing. No return is submitted.
                    </Notice>
                  ),
                })
              }
            >
              Preview tax schedule
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                printPreview("Tax schedule preview", [
                  "Gross: ₦240,000",
                  "Example withholding: ₦24,000",
                  "Net: ₦216,000",
                  "October 2026 · illustrative only, verify before filing",
                ])
              }
            >
              Print / Save PDF
            </Button>
            <Notice>
              Tax applicability and filing requirements need professional review. No tax return is submitted.
            </Notice>
          </Panel>
          <ReportExportBuilder rows={rows} />
        </aside>
      </div>
    </>
  );
}
