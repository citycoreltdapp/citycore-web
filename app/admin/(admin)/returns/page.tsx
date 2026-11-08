"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type ReturnScheduleForm,
  accrualOverrideFormSchema,
  maturityFormSchema,
  returnScheduleFormSchema,
} from "@/constant/schemas/admin-treasury";
import { previewCsv, previewDividends } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { DISBURSEMENT_HISTORY, RETURN_COHORTS } from "../_operations/treasury-data";
import { FinanceDate, FinanceNumber, FinanceText, downloadCsv, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { FilterChips, SegmentBar, StatusPill, formatDate } from "../account/page";
import { DetailList } from "../users/page";

const DEFAULTS: ReturnScheduleForm = {
  propertyId: "all",
  basis: "30/360",
  annualRate: 16,
  frequency: "quarterly",
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
  creditDate: "2026-10-31",
  withholdingRate: 10,
  reason: "Quarterly distribution schedule for compliance review",
};
const REQUEST_KINDS = ["dividend-batch", "principal-batch", "accrual-override", "return-schedule"];
const HISTORY_STATUS = {
  successful: { tone: "success", label: "Paid" },
  pending: { tone: "warning", label: "Pending" },
  failed: { tone: "danger", label: "Failed" },
} as const;
const MATURITY_LINES = [
  { name: "Golden Estate", principal: 3_000_000, className: "bg-foreground" },
  { name: "Silver City", principal: 2_000_000, className: "bg-accent" },
];
const MATURITY_TOTAL = MATURITY_LINES.reduce((total, line) => total + line.principal, 0);
const EXISTING_ACCRUAL = 4000;
const COHORT_COLORS = ["bg-foreground", "bg-accent"];

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border p-5 first:border-none">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

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

export default function ReturnsPage() {
  const { submit, requests, ready } = useReviewRequests();
  const form = useForm<ReturnScheduleForm>({
    resolver: zodResolver(returnScheduleFormSchema),
    defaultValues: DEFAULTS,
    mode: "onChange",
  });
  const [snapshot, setSnapshot] = React.useState(DEFAULTS);
  React.useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        const parsed = returnScheduleFormSchema.safeParse(values);
        if (parsed.success) setSnapshot(parsed.data);
      },
    });
  }, [form]);

  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    const saved = requests.find((r) => r.kind === "return-schedule");
    const parsed = saved && returnScheduleFormSchema.safeParse(saved.details);
    if (parsed?.success) form.reset(parsed.data);
  }, [ready, requests, form]);

  const groups = previewDividends(snapshot, RETURN_COHORTS);
  const totals = groups.reduce(
    (t, g) => ({
      gross: t.gross + Math.round(g.gross * 100),
      tax: t.tax + Math.round(g.tax * 100),
      net: t.net + Math.round(g.net * 100),
      investors: t.investors + g.investors,
    }),
    { gross: 0, tax: 0, net: 0, investors: 0 }
  );
  const [gross, tax, net] = [totals.gross / 100, totals.tax / 100, totals.net / 100];
  const batchId = `DIV-${snapshot.propertyId}-${snapshot.periodStart}-${snapshot.periodEnd}`;
  const openRequests = requests.filter((r) => REQUEST_KINDS.includes(r.kind));

  const maturity = useForm<z.infer<typeof maturityFormSchema>>({
    resolver: zodResolver(maturityFormSchema),
    defaultValues: {
      releaseDate: "2026-11-30",
      evidenceReference: "",
      reason: "Principal realization release for maturity review",
    },
  });
  const override = useForm<z.infer<typeof accrualOverrideFormSchema>>({
    resolver: zodResolver(accrualOverrideFormSchema),
    defaultValues: {
      reference: "ACC-GE-0104",
      existing: EXISTING_ACCRUAL,
      proposed: 3800,
      reason: "",
      evidenceReference: "",
      checkerId: "staff-nneka",
    },
  });
  const proposed = Number(useWatch({ control: override.control, name: "proposed" })) || 0;
  const delta = proposed - EXISTING_ACCRUAL;

  const reviewDividend = () =>
    reviewBatch({
      title: "Review dividend batch",
      batchId,
      content: (
        <Notice>
          {totals.investors} investors · net credits {money(net)} · proposed {formatDate(snapshot.creditDate)}. Funding
          and duplicate checks are still unverified.
        </Notice>
      ),
      onSave: (v) =>
        submit({
          kind: "dividend-batch",
          subjectId: batchId,
          summary: `Dividend · ${money(net)}`,
          reason: v.reason,
          details: { ...snapshot, checkerId: v.checkerId, gross, tax, net },
        }),
    });

  const exportPreview = () =>
    downloadCsv(
      "dividend-preview.csv",
      previewCsv([
        ["Group", "Investors", "Gross", "Tax", "Net credit"],
        ...groups.map((g) => [g.name, g.investors, g.gross, g.tax, g.net]),
      ])
    );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Returns & maturity</h1>
          <p className="text-sm text-muted-foreground">
            Schedule distributions and principal releases · nothing is paid from this page
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 rounded-full px-4" onClick={exportPreview}>
            <HugeiconsIcon icon={Download04Icon} aria-hidden />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/admin/withdrawals" />}
          >
            Treasury & withdrawals
          </Button>
        </div>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">Net wallet credits · DIV-010</p>
              <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{money(net)}</p>
              <p className="mt-2 text-xs text-white/50">
                {formatDate(snapshot.periodStart)} – {formatDate(snapshot.periodEnd)} · {snapshot.basis} · credits{" "}
                {formatDate(snapshot.creditDate)}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">Awaiting checker</span>
          </div>

          <div className="relative flex flex-col gap-2.5">
            <SegmentBar
              className="h-2.5 bg-white/10"
              parts={[
                { key: "net", value: net, className: "bg-accent" },
                { key: "tax", value: tax, className: "bg-white/40" },
              ]}
            />
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
              <p className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                <span className="text-white/60">Net</span>
                <span className="font-semibold tabular-nums">{money(net)}</span>
              </p>
              <p className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full bg-white/40" />
                <span className="text-white/60">Withholding {snapshot.withholdingRate}%</span>
                <span className="font-semibold tabular-nums">{money(tax)}</span>
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
            <dl className="grid flex-1 grid-cols-3 gap-4">
              {[
                { label: "Gross", value: money(gross) },
                { label: "Investors", value: totals.investors },
                { label: "Target rate", value: `${snapshot.annualRate}% a year` },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-white/60">{label}</dt>
                  <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
                </div>
              ))}
            </dl>
            <Button
              className="h-10 rounded-full bg-white px-4 text-[#121212] hover:bg-white/90"
              disabled={!ready}
              onClick={reviewDividend}
            >
              Review batch
            </Button>
          </div>
        </section>

        <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Disbursement timeline" note="Dividends and principal releases" />
          <ol className="flex flex-col">
            {DISBURSEMENT_HISTORY.toSorted((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).map((batch) => {
              const status = HISTORY_STATUS[batch.status];
              return (
                <li key={batch.id} className="relative flex gap-3 pb-5 last:pb-0">
                  <span aria-hidden className="flex flex-col items-center pt-1">
                    <span
                      className={cn(
                        "size-2.5 rounded-full ring-4 ring-card",
                        batch.type === "principal" ? "bg-foreground" : "bg-accent"
                      )}
                    />
                    <span className="mt-1 w-px flex-1 bg-border [li:last-child_&]:hidden" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{batch.id}</span>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">
                        {batch.type} · {formatDate(batch.scheduledDate)}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">{money(batch.net)}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <Link
            href="/admin/withdrawals"
            className="mt-auto flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Treasury ledger
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
          <div className="border-b border-border p-5">
            <CardHeader title="Interest scheduler" note="The batch preview updates as you edit" />
          </div>
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <Section step={1} title="Scope">
              {(
                [
                  {
                    name: "propertyId",
                    label: "Property",
                    options: [
                      { value: "all", label: "All properties" },
                      ...RETURN_COHORTS.map((c) => ({ value: c.id, label: c.name })),
                    ],
                  },
                  {
                    name: "basis",
                    label: "Accrual basis",
                    options: [
                      { value: "30/360", label: "30/360" },
                      { value: "actual/365", label: "Actual/365" },
                    ],
                  },
                  {
                    name: "frequency",
                    label: "Payout frequency",
                    options: [
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "annual", label: "Annual" },
                    ],
                  },
                ] as const
              ).map(({ name, label, options }) => (
                <div key={name} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Controller
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FilterChips
                        label={label}
                        value={field.value as string}
                        onChange={field.onChange}
                        options={[...options]}
                      />
                    )}
                  />
                </div>
              ))}
            </Section>
            <Section step={2} title="Period">
              <div className="grid gap-4 sm:grid-cols-3">
                <FinanceDate form={form} name="periodStart" label="Accrual starts" />
                <FinanceDate form={form} name="periodEnd" label="Accrual ends" />
                <FinanceDate form={form} name="creditDate" label="Credit date" />
              </div>
            </Section>
            <Section step={3} title="Rates & reason">
              <div className="grid gap-4 sm:grid-cols-2">
                <FinanceNumber form={form} name="annualRate" label="Annual target rate (%)" />
                <FinanceNumber form={form} name="withholdingRate" label="Example withholding (%)" />
              </div>
              <FinanceText form={form} name="reason" label="Schedule reason" area />
              <Notice>
                Target returns aren&apos;t owed or guaranteed. Confirm approved distributable income and the contract
                basis before scheduling. The preview counts both period dates.
              </Notice>
            </Section>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full px-4"
                onClick={() => form.reset(DEFAULTS)}
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4"
                disabled={!ready}
                onClick={form.handleSubmit((v) =>
                  submit(
                    {
                      kind: "return-schedule",
                      subjectId: `${v.propertyId}:${v.periodStart}:${v.periodEnd}`,
                      summary: `Schedule · ${v.creditDate}`,
                      reason: v.reason,
                      details: { ...v },
                    },
                    { replaceDraft: true }
                  )
                )}
              >
                Save schedule draft
              </Button>
              <Button
                type="button"
                className="h-10 rounded-full px-5"
                disabled={!ready}
                onClick={form.handleSubmit(() => reviewDividend())}
              >
                Review batch
              </Button>
            </div>
          </form>
        </Card>

        <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8 xl:sticky xl:top-24">
          <CardHeader title="Batch breakdown" note={`${totals.investors} eligible investors`} />
          <SegmentBar
            className="bg-muted"
            parts={groups.map((g, i) => ({ key: g.id, value: g.net, className: COHORT_COLORS[i % 2] }))}
          />
          <ul className="flex flex-col">
            {groups.map((g, i) => (
              <li key={g.id} className="flex items-start gap-3 border-b border-border py-3 last:border-none">
                <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", COHORT_COLORS[i % 2])} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{g.name}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {g.investors} investors · gross {money(g.gross)} · tax {money(g.tax)}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{money(g.net)}</span>
              </li>
            ))}
          </ul>
          <DetailList
            className="rounded-xl bg-muted/50 px-4"
            rows={[
              ["Batch total", money(net)],
              ["Prepared by", "Tunde Bello"],
              ["Checker", "Independent approval"],
              [
                "Duplicate check",
                <StatusPill key="dup" tone="muted">
                  Server pending
                </StatusPill>,
              ],
              [
                "Funding",
                <StatusPill key="fund" tone="warning">
                  Treasury review
                </StatusPill>,
              ],
            ]}
          />
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Principal release" note="MAT-004 · separate from dividends">
            <StatusPill tone="muted">Draft</StatusPill>
          </CardHeader>
          <div>
            <p className="text-3xl font-light tabular-nums">{money(MATURITY_TOTAL)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Principal only. Accrued yield is excluded.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <SegmentBar
              className="bg-muted"
              parts={MATURITY_LINES.map((line) => ({
                key: line.name,
                value: line.principal,
                className: line.className,
              }))}
            />
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {MATURITY_LINES.map((line) => (
                <div key={line.name} className="flex items-center gap-2">
                  <span aria-hidden className={cn("size-2 rounded-full", line.className)} />
                  <dt className="text-muted-foreground">{line.name}</dt>
                  <dd className="font-semibold tabular-nums">{money(line.principal)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <form
            noValidate
            className="flex flex-col gap-4 border-t border-border pt-5"
            onSubmit={maturity.handleSubmit((values) =>
              reviewBatch({
                title: "Review principal release",
                batchId: "MAT-004",
                content: (
                  <Notice>
                    Principal only: {money(MATURITY_TOTAL)}. Settlement evidence: {values.evidenceReference}. Release{" "}
                    {formatDate(values.releaseDate)}.
                  </Notice>
                ),
                onSave: (v) =>
                  submit({
                    kind: "principal-batch",
                    subjectId: "MAT-004",
                    summary: `Principal release · ${values.releaseDate}`,
                    reason: v.reason,
                    details: { ...values, checkerId: v.checkerId, principal: MATURITY_TOTAL },
                  }),
              })
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceText form={maturity} name="evidenceReference" label="Settlement evidence" />
              <FinanceDate form={maturity} name="releaseDate" label="Release date" />
            </div>
            <FinanceText form={maturity} name="reason" label="Recorded reason" area />
            <p className="text-xs text-muted-foreground">
              Principal and dividends post as separate ledger entries. Holdings are marked matured only after the wallet
              posting is confirmed.
            </p>
            <Button type="submit" variant="outline" className="rounded-full" disabled={!ready}>
              Review principal release
            </Button>
          </form>
        </Card>

        <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Accrual correction" note="Restricted · the original record is kept">
            <StatusPill tone="muted">Needs 2nd approval</StatusPill>
          </CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Recorded</p>
              <p className="mt-1 text-xl font-light tabular-nums">{money(EXISTING_ACCRUAL)}</p>
            </div>
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Proposed</p>
              <p className="mt-1 text-xl font-light tabular-nums">{money(proposed)}</p>
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Change{" "}
            <span className={cn("font-semibold tabular-nums", delta < 0 ? "text-destructive" : "text-success")}>
              {delta < 0 ? "−" : "+"}
              {money(Math.abs(delta))}
            </span>{" "}
            · excluded from DIV-010 until approved and revalidated
          </p>
          <form
            noValidate
            className="flex flex-col gap-4 border-t border-border pt-5"
            onSubmit={override.handleSubmit((values) =>
              reviewBatch({
                title: "Review accrual correction",
                batchId: values.reference,
                content: (
                  <Notice>
                    {money(values.existing)} → {money(values.proposed)}. The original record is kept, and the change
                    stays out of dividend totals until it&apos;s approved and revalidated.
                  </Notice>
                ),
                onSave: (v) =>
                  submit({
                    kind: "accrual-override",
                    subjectId: values.reference,
                    summary: `Accrual adjustment · ${money(values.proposed - values.existing)}`,
                    reason: values.reason,
                    details: { ...values, checkerId: v.checkerId },
                  }),
              })
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceText form={override} name="reference" label="Accrual reference" />
              <FinanceNumber form={override} name="proposed" label="Proposed accrual" prefix="₦" />
            </div>
            <FinanceText form={override} name="evidenceReference" label="Evidence reference" />
            <FinanceText form={override} name="reason" label="Recorded reason" area />
            <Button type="submit" variant="outline" className="rounded-full" disabled={!ready}>
              Request correction
            </Button>
          </form>
        </Card>
      </div>

      {openRequests.length > 0 && (
        <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Open requests" note="Saved in this browser · nothing has been paid" />
          <ul className="flex flex-col">
            {openRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{r.summary}</span>
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
  );
}
