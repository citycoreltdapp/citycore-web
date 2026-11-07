"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type AdminWithdrawal,
  manualLedgerFormSchema,
  withdrawalRiskFormSchema,
} from "@/constant/schemas/admin-treasury";
import { withdrawalTotals } from "@/lib/treasury-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { TREASURY_ACCOUNTS, WITHDRAWAL_QUEUE } from "../_operations/treasury-data";
import { FinanceNumber, FinanceSelect, FinanceText, money, reviewBatch } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { FilterChips, StatusPill, type Tone, formatDate, toneDot } from "../account/_ui";
import { CheckMark } from "../kyc/_ui";
import { DetailList, Initials } from "../users/_ui";

const REQUEST_KINDS = ["withdrawal-risk", "withdrawal-batch", "ledger-adjustment"];
const RISK = {
  clear: { label: "Clear", tone: "success" },
  "new-device": { label: "New device", tone: "warning" },
  velocity: { label: "Velocity", tone: "warning" },
} as const satisfies Record<AdminWithdrawal["risk"], { label: string; tone: Tone }>;
const OWNERSHIP: Record<string, string> = {
  platform: "Platform owned",
  "investors-restricted": "Investors · restricted",
  "investor-collections": "Investor collections",
  "settlement-receivable": "Settlement receivable",
};
const DECISIONS = [
  { value: "hold", label: "Hold", hint: "Pending customer verification", tone: "warning" },
  { value: "escalate", label: "Escalate", hint: "Send to compliance", tone: "danger" },
  { value: "clear-for-checker", label: "Request clearance", hint: "A checker verifies the evidence", tone: "success" },
] as const;
const isUnresolved = (w: AdminWithdrawal) => w.risk !== "clear" || !w.kycVerified || !w.bankVerified;
const [OPERATING, ...SEGREGATED] = TREASURY_ACCOUNTS;

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

function openEvidence(w: AdminWithdrawal) {
  AppModal.open({
    title: `Risk evidence · ${w.name}`,
    description: w.id,
    content: (
      <div className="space-y-4">
        <DetailList
          rows={[
            ["KYC", w.kycVerified ? "Verified snapshot" : "Not verified"],
            ["Bank ownership", w.bankVerified ? `Verified · ••${w.bankLast4}` : "Not verified"],
            ["Risk signal", RISK[w.risk].label],
          ]}
        />
        <Notice>
          Connect the authorized evidence service to inspect the original records. These masked sample details are not a
          clearance decision.
        </Notice>
      </div>
    ),
  });
}

function RiskReviewCard({
  withdrawal,
  submit,
  ready,
}: { withdrawal: AdminWithdrawal } & Pick<ReturnType<typeof useReviewRequests>, "submit" | "ready">) {
  const form = useForm<z.infer<typeof withdrawalRiskFormSchema>>({
    resolver: zodResolver(withdrawalRiskFormSchema),
    defaultValues: { decision: "hold", reason: "" },
  });
  const risk = RISK[withdrawal.risk];
  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-4 border-b border-border p-5">
        <div className="flex items-center gap-3">
          <Initials name={withdrawal.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{withdrawal.name}</p>
            <p className="text-xs text-muted-foreground">
              {withdrawal.id} · {withdrawal.investorId}
            </p>
          </div>
          <StatusPill tone={risk.tone}>{risk.label}</StatusPill>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Requested</p>
          <p className="mt-1 text-3xl font-light tabular-nums">{money(withdrawal.amount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            To ••{withdrawal.bankLast4} · fee {money(withdrawal.fee)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <CheckMark ok={withdrawal.kycVerified} label="KYC" />
          <CheckMark ok={withdrawal.bankVerified} label="Bank owner" />
          <CheckMark ok={withdrawal.risk === "clear"} label={risk.label} />
          <button
            type="button"
            onClick={() => openEvidence(withdrawal)}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={ViewIcon} aria-hidden className="size-3.5" />
            Evidence
          </button>
        </div>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4 p-5"
        onSubmit={form.handleSubmit((values) => {
          if (
            submit({
              kind: "withdrawal-risk",
              subjectId: withdrawal.id,
              summary: `${withdrawal.name} · ${DECISIONS.find((d) => d.value === values.decision)?.label}`,
              reason: values.reason,
              details: { ...values, version: withdrawal.version },
            })
          )
            form.reset();
        })}
      >
        <Controller
          control={form.control}
          name="decision"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Reviewer decision" className="flex flex-col gap-1.5">
              {DECISIONS.map((option) => (
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
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", toneDot(option.tone))} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        />
        <FinanceText form={form} name="reason" label="Recorded risk reason" area />
        <Controller
          name="identityReviewed"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={field.value === true} onCheckedChange={field.onChange} />I reviewed identity and bank
                ownership evidence.
              </label>
              {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Button type="submit" className="h-10 rounded-full" disabled={!ready}>
          Save review decision
        </Button>
        <p className="text-xs text-muted-foreground">
          A clearance request doesn&apos;t resolve the live flag. A checker must verify the source evidence.
        </p>
      </form>
    </Card>
  );
}

export function TreasuryPage() {
  const { submit, requests, ready } = useReviewRequests();
  const [ids, setIds] = React.useState(["WD-041", "WD-043"]);
  const [selected, setSelected] = React.useState(WITHDRAWAL_QUEUE[0]);
  const [queried, setQueried] = React.useState(false);
  const rows = WITHDRAWAL_QUEUE.filter((r) => ids.includes(r.id));
  const totals = withdrawalTotals(rows);
  const unresolved = rows.filter(isUnresolved);
  const batchId = `WB-041-${ids.toSorted().join("-")}`;
  const openRequests = requests.filter((r) => REQUEST_KINDS.includes(r.kind));
  const allSelected = ids.length === WITHDRAWAL_QUEUE.length;

  const ledger = useForm<z.infer<typeof manualLedgerFormSchema>>({
    resolver: zodResolver(manualLedgerFormSchema),
    defaultValues: {
      accountId: "operating",
      direction: "debit",
      amount: 25000,
      counterAccount: "bank-charges",
      memo: "",
      supportingReference: "",
      checkerId: "staff-nneka",
    },
  });

  const reviewSelected = () =>
    reviewBatch({
      title: "Review withdrawal batch",
      batchId,
      content: (
        <Notice>
          {rows.map((r) => r.name).join(", ")} · recipients receive {money(totals.recipients)} · wallet debit{" "}
          {money(totals.walletDebit)}. {unresolved.length} unresolved risk flag{unresolved.length === 1 ? "" : "s"}.
          Nothing is sent to the bank.
        </Notice>
      ),
      onSave: (v) =>
        submit({
          kind: "withdrawal-batch",
          subjectId: batchId,
          summary: `Withdrawal review · ${rows.length} requests`,
          reason: v.reason,
          details: {
            withdrawalIds: ids.join(","),
            checkerId: v.checkerId,
            amount: totals.recipients,
            fees: totals.fees,
            unresolved: unresolved.length,
          },
        }),
    });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Treasury & withdrawals</h1>
          <p className="text-sm text-muted-foreground">
            Segregated funds and withdrawal approvals · sandbox snapshot, no money moves here
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/returns" />}
          >
            Returns & maturity
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/platform/banking" />}
          >
            Banking integration
          </Button>
        </div>
      </header>

      <section className="relative grid gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Platform operating funds</p>
            <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{money(OPERATING.balance)}</p>
            <p className="mt-2 text-xs text-white/50">{OPERATING.destination} · fees and revenue only</p>
          </div>
          <p className="max-w-sm text-xs/5 text-white/50">
            Investor money is never operating cash. These accounts belong to different owners, so they&apos;re shown
            apart and never added together.
          </p>
        </div>
        <ul className="relative grid gap-3 sm:grid-cols-3">
          {SEGREGATED.map((account) => (
            <li key={account.id} className="flex flex-col gap-1 rounded-xl bg-white/6 p-4 ring-1 ring-white/10">
              <p className="text-xs text-white/60">{account.name}</p>
              <p className="truncate text-lg font-light tabular-nums">{money(account.balance)}</p>
              <p className="truncate text-xs text-white/50">{account.destination}</p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/70">
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", account.id === "escrow" ? "bg-accent" : "bg-white/40")}
                />
                {OWNERSHIP[account.ownership] ?? account.ownership} · {account.state}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <CardHeader title="High-value queue" note="WB-041 · pick requests to batch, select a row to review it">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  aria-label="Select all withdrawals"
                  checked={allSelected}
                  indeterminate={!allSelected && ids.length > 0}
                  onCheckedChange={(checked) => setIds(checked ? WITHDRAWAL_QUEUE.map((r) => r.id) : [])}
                />
                All
              </label>
            </CardHeader>
            <ul className="flex flex-col gap-1">
              {WITHDRAWAL_QUEUE.map((w) => {
                const isActive = w.id === selected.id;
                const risk = RISK[w.risk];
                return (
                  <li
                    key={w.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      aria-label={`Add ${w.name} to the batch`}
                      checked={ids.includes(w.id)}
                      onCheckedChange={(checked) =>
                        setIds((current) => (checked ? [...current, w.id] : current.filter((id) => id !== w.id)))
                      }
                    />
                    <button
                      type="button"
                      aria-current={isActive}
                      onClick={() => setSelected(w)}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left outline-none focus-visible:underline"
                    >
                      <Initials name={w.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{w.name}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {w.id} · ••{w.bankLast4}
                        </span>
                      </span>
                      <StatusPill tone={risk.tone}>{risk.label}</StatusPill>
                      <span className="w-32 text-right text-sm font-semibold tabular-nums">{money(w.amount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Selected", `${rows.length} of ${WITHDRAWAL_QUEUE.length}`],
                  ["Recipients receive", money(totals.recipients)],
                  [`Fees · ${rows.length} × ₦50`, money(totals.fees)],
                  ["Wallet debit", money(totals.walletDebit)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 truncate font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className={cn("text-xs", unresolved.length ? "text-warning" : "text-muted-foreground")}>
                {unresolved.length
                  ? `${unresolved.length} selected request${unresolved.length === 1 ? " needs" : "s need"} enhanced review.`
                  : rows.length
                    ? "Checks for the selected requests are clear in this snapshot."
                    : "Select at least one request."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="h-10 rounded-full px-4" disabled={!rows.length || !ready} onClick={reviewSelected}>
                  Review batch
                </Button>
                <Button variant="outline" className="h-10 rounded-full px-4" disabled>
                  <HugeiconsIcon icon={LockIcon} aria-hidden />
                  Send to bank
                </Button>
                <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-56 sm:text-right">
                  Locked until risk, funding and an independent checker are verified on the server.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
              <CardHeader title="Failed settlement" note="WB-040 · SET-118">
                <StatusPill tone={queried ? "muted" : "warning"}>{queried ? "Still unknown" : "Unknown"}</StatusPill>
              </CardHeader>
              <div>
                <p className="text-3xl font-light tabular-nums">{money(500000)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Demo Bank · ••6021</p>
              </div>
              <DetailList
                rows={[
                  ["Last response", "Timeout"],
                  ["Final bank status", "Unknown"],
                  ["Status query", queried ? "Provider not configured" : "Not queried"],
                ]}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => {
                    setQueried(true);
                    AppModal.open({
                      title: "Settlement status query",
                      content: (
                        <Notice>
                          The bank integration isn&apos;t configured, so no endpoint was contacted. SET-118 stays
                          unknown. Query the original provider reference before any retry.
                        </Notice>
                      ),
                    });
                  }}
                >
                  Query status
                </Button>
                <Button className="flex-1 rounded-full" disabled>
                  Retry
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Retry only after non-settlement is confirmed and duplicates are checked. If it settled, reconcile the
                original reference instead.
              </p>
            </Card>

            <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
              <CardHeader title="Ledger adjustment" note="Operating account only · memo required">
                <StatusPill tone="muted">Draft</StatusPill>
              </CardHeader>
              <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={ledger.handleSubmit((values) =>
                  reviewBatch({
                    title: "Review ledger adjustment",
                    batchId: `ADJ-${values.supportingReference}`,
                    content: (
                      <Notice>
                        {values.direction} {money(values.amount)} · platform operating · counter-account{" "}
                        {values.counterAccount}. Investor escrow is excluded.
                      </Notice>
                    ),
                    onSave: (v) =>
                      submit({
                        kind: "ledger-adjustment",
                        subjectId: values.supportingReference,
                        summary: `Operating ledger ${values.direction} · ${money(values.amount)}`,
                        reason: values.memo,
                        details: { ...values, checkerId: v.checkerId },
                      }),
                  })
                )}
              >
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-semibold">Platform operating · ••1001</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Direction</span>
                  <Controller
                    control={ledger.control}
                    name="direction"
                    render={({ field }) => (
                      <FilterChips
                        label="Direction"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "debit", label: "Debit" },
                          { value: "credit", label: "Credit" },
                        ]}
                      />
                    )}
                  />
                </div>
                <FinanceNumber form={ledger} name="amount" label="Amount" prefix="₦" />
                <FinanceSelect
                  form={ledger}
                  name="counterAccount"
                  label="Counter-account"
                  items={[
                    { value: "bank-charges", label: "Bank charges expense · 5102" },
                    { value: "fee-revenue", label: "Fee revenue · 4100" },
                  ]}
                />
                <FinanceText form={ledger} name="memo" label="Memo" area />
                <FinanceText form={ledger} name="supportingReference" label="Supporting reference" />
                <Button type="submit" variant="outline" className="rounded-full" disabled={!ready}>
                  Review adjustment
                </Button>
                <p className="text-xs text-muted-foreground">
                  Investor escrow can&apos;t fund operating adjustments. Every posting keeps the original audit history.
                </p>
              </form>
            </Card>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-24">
          <RiskReviewCard key={selected.id} withdrawal={selected} submit={submit} ready={ready} />
        </div>
      </div>

      {openRequests.length > 0 && (
        <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Open requests" note="Saved in this browser · nothing was sent to a bank" />
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
