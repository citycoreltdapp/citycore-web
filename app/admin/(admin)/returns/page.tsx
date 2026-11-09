"use client";

import * as React from "react";

import { ResourceField, ResourceFieldItem } from "@/components/primitives/resource-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminInvestment } from "@/constant/schemas/admin-investments";
import { adminTaxSettingsSchema } from "@/constant/schemas/admin-settings";
import {
  type ReturnScheduleForm,
  accrualOverrideFormSchema,
  maturityFormSchema,
  returnScheduleFormSchema,
} from "@/constant/schemas/admin-treasury";
import { type ReturnOffering, accrualDays, previewCsv, previewDividends } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { DISBURSEMENT_HISTORY } from "../_operations/treasury-data";
import { FinanceDate, FinanceNumber, FinanceText, downloadCsv, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { TAX_DEFAULTS, TAX_SETTINGS_KEY } from "../_operations/workspace-data";
import { AS_OF } from "../account/_data";
import { SegmentBar, StatusPill, formatDate } from "../account/page";
import { FREQUENCY_ITEMS, maturityDate } from "../investments/_data";
import { useAdminInvestments } from "../investments/_store";
import { DetailList } from "../users/page";

const DEFAULTS: ReturnScheduleForm = {
  propertyId: "all",
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
  creditDate: "2026-10-31",
  reason: "Quarterly distribution schedule for compliance review",
};
// Roughly how many days each payout frequency covers, to flag a period that doesn't fit a property's schedule.
const FREQUENCY_DAYS = { monthly: 30, quarterly: 91, annual: 365 } as const;
const frequencyLabel = (value: string) => FREQUENCY_ITEMS.find((item) => item.value === value)?.label ?? value;
const REQUEST_KINDS = ["dividend-batch", "principal-batch", "accrual-override", "return-schedule"];
const HISTORY_STATUS = {
  successful: { tone: "success", label: "Paid" },
  pending: { tone: "warning", label: "Pending" },
  failed: { tone: "danger", label: "Failed" },
} as const;
const EXISTING_ACCRUAL = 4000;
const COHORT_COLORS = ["bg-foreground", "bg-accent", "bg-foreground/50", "bg-accent/50"];

/** Investments paying returns: live and with units sold. Terms come from the investment, not this page. */
const toOffering = (i: AdminInvestment): ReturnOffering => ({
  id: i.id,
  name: i.name,
  units: i.unitsSold,
  principal: i.unitsSold * i.unitPrice,
  annualRate: i.targetRoi,
  basis: i.accrualBasis,
  frequency: i.payoutFrequency,
});
type PropertyOption = Pick<ReturnOffering, "id" | "name" | "units" | "principal"> & { terms?: ReturnOffering };

const daysUntil = (date: string) => Math.round((Date.parse(date) - Date.parse(AS_OF)) / 86_400_000);

function PropertyMark({ option }: { option: PropertyOption }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold",
        option.id === "all" ? "bg-foreground text-background" : "bg-accent/20 text-foreground"
      )}
    >
      {option.id === "all"
        ? "ALL"
        : option.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
    </span>
  );
}

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
  const { investments } = useAdminInvestments();
  const taxSettings = usePreviewState(TAX_SETTINGS_KEY, adminTaxSettingsSchema, TAX_DEFAULTS);
  const withholdingRate = taxSettings.value.withholdingRate;
  const live = investments.filter((i) => i.publicationStatus === "active" && i.unitsSold > 0);
  const offerings = live.map(toOffering);
  // ponytail: a flat list scales to a few hundred properties; switch to server search when it outgrows that.
  const propertyOptions: PropertyOption[] = [
    {
      id: "all",
      name: "All properties",
      units: offerings.reduce((total, o) => total + o.units, 0),
      principal: offerings.reduce((total, o) => total + o.principal, 0),
    },
    ...offerings.map((o) => ({ ...o, terms: o })),
  ];
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

  // A saved draft may point at a property that no longer pays returns; fall back to all of them.
  const scope = offerings.some((o) => o.id === snapshot.propertyId) ? snapshot : { ...snapshot, propertyId: "all" };
  const selected = offerings.find((o) => o.id === scope.propertyId);
  const groups = previewDividends(scope, offerings, withholdingRate);
  const periodDays = accrualDays(scope.periodStart, scope.periodEnd, "actual/365");
  const fitsPeriod = (frequency: ReturnOffering["frequency"]) =>
    Math.abs(periodDays - FREQUENCY_DAYS[frequency]) / FREQUENCY_DAYS[frequency] <= 0.2;
  const rates = [...new Set(groups.map((g) => g.annualRate))].toSorted((a, b) => a - b);
  const totals = groups.reduce(
    (t, g) => ({
      gross: t.gross + Math.round(g.gross * 100),
      tax: t.tax + Math.round(g.tax * 100),
      net: t.net + Math.round(g.net * 100),
      units: t.units + g.units,
    }),
    { gross: 0, tax: 0, net: 0, units: 0 }
  );
  const [gross, tax, net] = [totals.gross / 100, totals.tax / 100, totals.net / 100];
  const batchId = `DIV-${scope.propertyId}-${scope.periodStart}-${scope.periodEnd}`;

  const maturities = live
    .map((i) => ({ id: i.id, name: i.name, date: maturityDate(i), principal: i.unitsSold * i.unitPrice }))
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const [maturityId, setMaturityId] = React.useState<string | null>(null);
  const release = maturities.find((m) => m.id === maturityId) ?? maturities[0];
  const openRequests = requests.filter((r) => REQUEST_KINDS.includes(r.kind));

  const maturity = useForm<z.infer<typeof maturityFormSchema>>({
    resolver: zodResolver(maturityFormSchema),
    defaultValues: {
      releaseDate: release?.date ?? AS_OF,
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
          {groups.length} {groups.length === 1 ? "property" : "properties"} · {totals.units.toLocaleString()} units ·
          net credits {money(net)} after {withholdingRate}% withholding · proposed {formatDate(scope.creditDate)}.
          Funding and duplicate checks are still unverified.
        </Notice>
      ),
      onSave: (v) =>
        submit({
          kind: "dividend-batch",
          subjectId: batchId,
          summary: `Dividend · ${money(net)}`,
          reason: v.reason,
          details: { ...scope, withholdingRate, checkerId: v.checkerId, gross, tax, net },
        }),
    });

  const exportPreview = () =>
    downloadCsv(
      "dividend-preview.csv",
      previewCsv([
        ["Property", "Units", "Rate %", "Basis", "Pays", "Gross", "Tax", "Net credit"],
        ...groups.map((g) => [g.name, g.units, g.annualRate, g.basis, g.frequency, g.gross, g.tax, g.net]),
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
              <p className="text-sm text-white/60">Net wallet credits · {selected?.name ?? "All properties"}</p>
              <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{money(net)}</p>
              <p className="mt-2 text-xs text-white/50">
                {formatDate(scope.periodStart)} – {formatDate(scope.periodEnd)} · credits {formatDate(scope.creditDate)}
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
                <span className="text-white/60">Withholding {withholdingRate}%</span>
                <span className="font-semibold tabular-nums">{money(tax)}</span>
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
            <dl className="grid flex-1 grid-cols-3 gap-4">
              {[
                { label: "Gross", value: money(gross) },
                { label: "Units paid", value: totals.units.toLocaleString() },
                {
                  label: "Target rate",
                  value: rates.length > 1 ? `${rates[0]}–${rates.at(-1)}%` : `${rates[0] ?? 0}% a year`,
                },
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
              <Controller
                control={form.control}
                name="propertyId"
                render={({ field, fieldState }) => (
                  <ResourceField
                    id="returns-property"
                    label="Property"
                    error={fieldState.error?.message}
                    value={propertyOptions.find((option) => option.id === scope.propertyId) ?? null}
                    onChange={(option) => option && field.onChange(option.id)}
                    items={propertyOptions}
                    getItemKey={(option) => option.id}
                    getItemTitle={(option) => option.name}
                    getItemGroup={(option) => (option.id === "all" ? "" : "Paying returns")}
                    searchFilter={(option, term) => option.name.toLowerCase().includes(term)}
                    placeholder="Choose a property"
                    searchPlaceholder="Search properties"
                    emptyMessage="No property matches that search."
                    triggerClassName="h-12"
                    renderSummary={(option) => (
                      <>
                        <PropertyMark option={option} />
                        <span className="truncate font-semibold text-foreground">{option.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {option.terms
                            ? `${option.terms.annualRate}% · ${frequencyLabel(option.terms.frequency).toLowerCase()}`
                            : `${offerings.length} properties`}
                        </span>
                      </>
                    )}
                    renderSearchItem={(option, isSelected) => (
                      <ResourceFieldItem selected={isSelected}>
                        <PropertyMark option={option} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{option.name}</span>
                          <span className="block truncate text-xs text-muted-foreground tabular-nums">
                            {option.terms
                              ? `${option.terms.annualRate}% · ${frequencyLabel(option.terms.frequency)} · ${money(option.principal)}`
                              : `Each on its own terms · ${money(option.principal)}`}
                          </span>
                        </span>
                      </ResourceFieldItem>
                    )}
                  />
                )}
              />
              {selected ? (
                <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    {[
                      ["Target rate", `${selected.annualRate}% a year`],
                      ["Pays", frequencyLabel(selected.frequency)],
                      ["Interest basis", selected.basis],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="mt-0.5 truncate font-semibold tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    Set when the investment was created, so every payout uses the same terms.
                    <Link
                      href={`/admin/investments/${encodeURIComponent(selected.id)}`}
                      className="flex items-center gap-1 font-semibold text-foreground underline-offset-4 hover:underline"
                    >
                      View investment
                      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-3.5" />
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="rounded-xl bg-muted/50 p-4 text-xs/5 text-muted-foreground">
                  Each property pays at its own rate and on its own basis, as set when the investment was created. The
                  breakdown shows each one.
                </p>
              )}
            </Section>
            <Section step={2} title="Period">
              <div className="grid gap-4 sm:grid-cols-3">
                <FinanceDate form={form} name="periodStart" label="Accrual starts" />
                <FinanceDate form={form} name="periodEnd" label="Accrual ends" />
                <FinanceDate form={form} name="creditDate" label="Credit date" />
              </div>
            </Section>
            <Section step={3} title="Reason">
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
          <CardHeader
            title="Batch breakdown"
            note={`${groups.length} ${groups.length === 1 ? "property" : "properties"} · ${periodDays}-day period`}
          />
          <SegmentBar
            className="bg-muted"
            parts={groups.map((g, i) => ({
              key: g.id,
              value: g.net,
              className: COHORT_COLORS[i % COHORT_COLORS.length],
            }))}
          />
          <ul className="flex flex-col">
            {groups.map((g, i) => (
              <li key={g.id} className="flex items-start gap-3 border-b border-border py-3 last:border-none">
                <span
                  aria-hidden
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", COHORT_COLORS[i % COHORT_COLORS.length])}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{g.name}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {g.annualRate}% · {g.basis} · gross {money(g.gross)} · tax {money(g.tax)}
                  </span>
                  {!fitsPeriod(g.frequency) && (
                    <span className="mt-1.5 inline-flex">
                      <StatusPill tone="warning">Pays {frequencyLabel(g.frequency).toLowerCase()}</StatusPill>
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold tabular-nums">{money(g.net)}</span>
              </li>
            ))}
            {!groups.length && (
              <li className="py-6 text-center text-sm text-muted-foreground">No investment is paying returns yet.</li>
            )}
          </ul>
          <DetailList
            className="rounded-xl bg-muted/50 px-4"
            rows={[
              ["Batch total", money(net)],
              [
                "Withholding",
                <Link
                  key="tax"
                  href="/admin/settings/tax"
                  className="underline-offset-4 hover:underline"
                  title="Change in tax settings"
                >
                  {withholdingRate}%
                </Link>,
              ],
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
          <CardHeader title="Principal release" note="Upcoming maturities · separate from dividends">
            <StatusPill tone="muted">Draft</StatusPill>
          </CardHeader>
          {release ? (
            <div>
              <p className="text-3xl font-light tabular-nums">{money(release.principal)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {release.name} · principal only, returns are paid separately.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No investment has units to release yet.</p>
          )}
          <ul role="radiogroup" aria-label="Maturing investment" className="flex flex-col gap-1.5">
            {maturities.slice(0, 4).map((m) => {
              const isActive = m.id === release?.id;
              const days = daysUntil(m.date);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => {
                      setMaturityId(m.id);
                      maturity.setValue("releaseDate", m.date, { shouldValidate: true });
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-card py-1 text-center ring-1 ring-foreground/5">
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {formatDate(m.date).split(" ")[1]}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{formatDate(m.date).split(" ")[0]}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{m.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {days > 0 ? `Matures in ${days} days` : "Matured"} · {formatDate(m.date)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{money(m.principal)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            noValidate
            className="flex flex-col gap-4 border-t border-border pt-5"
            onSubmit={maturity.handleSubmit((values) =>
              reviewBatch({
                title: "Review principal release",
                batchId: `MAT-${release?.id}`,
                content: (
                  <Notice>
                    {release?.name} · principal only: {money(release?.principal ?? 0)}. Settlement evidence:{" "}
                    {values.evidenceReference}. Release {formatDate(values.releaseDate)}.
                  </Notice>
                ),
                onSave: (v) =>
                  submit({
                    kind: "principal-batch",
                    subjectId: `MAT-${release?.id}`,
                    summary: `Principal release · ${release?.name} · ${values.releaseDate}`,
                    reason: v.reason,
                    details: { ...values, checkerId: v.checkerId, principal: release?.principal ?? 0 },
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
            <Button type="submit" variant="outline" className="rounded-full" disabled={!ready || !release}>
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
