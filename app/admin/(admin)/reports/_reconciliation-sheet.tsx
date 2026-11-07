"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type StatementRow, reconciliationFormSchema } from "@/constant/schemas/admin-reports";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDataTransferHorizontalIcon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceSelect, FinanceText, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { StatusPill, formatDate } from "../account/_ui";

type Reviews = ReturnType<typeof useReviewRequests>;

export function ReconciliationSheet({
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
