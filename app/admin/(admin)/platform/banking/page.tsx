"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { PasswordField } from "@/components/primitives/password-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  type BankingConfigForm,
  bankingConfigFormSchema,
  ledgerMappingSchema,
  postingPreviewFormSchema,
} from "@/constant/schemas/admin-treasury";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../../_operations/requests";
import { BANKING_RETRIES, LEDGER_MAPPINGS } from "../../_operations/treasury-data";
import { FinanceNumber, FinanceSelect, FinanceText, money, reviewBatch } from "../../_operations/treasury-ui";
import { Notice } from "../../_operations/ui";
import { FilterChips, StatusPill, type Tone, formatDate } from "../../account/_ui";
import { CardHeader, type Reviews, Section } from "../../content/_ui";
import { CheckMark } from "../../kyc/_ui";
import { DetailList, Initials } from "../../users/_ui";

const DEFAULTS: BankingConfigForm = {
  environment: "sandbox",
  endpoint: "https://sandbox.example.invalid/symplus",
  clientId: "",
  tenant: "",
  timeoutSeconds: 30,
  reason: "Initial sandbox setup for integration review",
};

function RequestPreview({ form }: { form: UseFormReturn<BankingConfigForm> }) {
  const values = useWatch({ control: form.control });
  const payload = {
    environment: values.environment,
    endpoint: values.endpoint,
    clientId: values.clientId || "—",
    tenant: values.tenant || "—",
    timeoutSeconds: values.timeoutSeconds,
    secret: "server secret store",
  };
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8 xl:sticky xl:top-24">
      <CardHeader title="Review payload" note="What the approver sees · no secrets leave the server" />
      <pre className="overflow-x-auto rounded-xl bg-[#121212] p-4 text-xs/6 text-white/80">
        {JSON.stringify(payload, null, 2)}
      </pre>
      <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
        {["HTTPS base URL only", "No credentials in query or fragment", "Timeout between 5 and 120 seconds"].map(
          (rule) => (
            <li key={rule} className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-foreground/30" />
              {rule}
            </li>
          )
        )}
      </ul>
    </Card>
  );
}

function ConnectionTab({ reviews }: { reviews: Reviews }) {
  const { submit, ready, requests } = reviews;
  const form = useForm<BankingConfigForm>({ resolver: zodResolver(bankingConfigFormSchema), defaultValues: DEFAULTS });
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    const draft = requests.find((r) => r.kind === "banking-config");
    if (!draft) return;
    const parsed = bankingConfigFormSchema.safeParse(draft.details);
    if (parsed.success) form.reset(parsed.data);
  }, [ready, requests, form]);
  const saved = requests.some((r) => r.kind === "banking-config");

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
        <form
          noValidate
          onSubmit={form.handleSubmit((values) =>
            submit(
              {
                kind: "banking-config",
                subjectId: "symplus-sandbox",
                summary: "Symplus sandbox configuration draft",
                reason: values.reason,
                details: { ...values },
              },
              { replaceDraft: true }
            )
          )}
        >
          <div className="border-b border-border p-5">
            <CardHeader title="Connection" note="Restricted to authorized integration administrators">
              <StatusPill tone={saved ? "warning" : "muted"}>{saved ? "Draft in review" : "Unconfigured"}</StatusPill>
            </CardHeader>
          </div>
          <Section step={1} title="Endpoint">
            <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <FinanceSelect
                form={form}
                name="environment"
                label="Environment"
                items={[{ value: "sandbox", label: "Sandbox" }]}
              />
              <FinanceText form={form} name="endpoint" label="Base endpoint" />
            </div>
            <div className="sm:w-48">
              <FinanceNumber form={form} name="timeoutSeconds" label="Timeout (seconds)" />
            </div>
          </Section>
          <Section step={2} title="Credentials">
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceText form={form} name="clientId" label="Client identifier (non-secret)" />
              <FinanceText form={form} name="tenant" label="Tenant / branch" />
              <div className="sm:col-span-2">
                <PasswordField
                  id="symplus-secret"
                  label="API secret"
                  value=""
                  onChange={() => {}}
                  disabled
                  placeholder="Configure in server secret store"
                  helpText="Credentials are never stored in browser drafts."
                />
              </div>
            </div>
          </Section>
          <Section step={3} title="Change">
            <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">Scheduled sync</span>
                <span className="block text-xs text-muted-foreground">Unavailable until configuration is approved</span>
              </span>
              <Switch aria-label="Enable scheduled sync" checked={false} disabled />
            </label>
            <FinanceText form={form} name="reason" label="Change reason" area />
          </Section>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
            <Button type="button" variant="ghost" className="h-10 rounded-full px-4" disabled>
              <HugeiconsIcon icon={LockIcon} aria-hidden />
              Test connection
            </Button>
            <Button type="submit" className="h-10 rounded-full px-5" disabled={!ready}>
              {saved ? "Update draft" : "Save configuration draft"}
            </Button>
          </div>
        </form>
      </Card>
      <RequestPreview form={form} />
    </div>
  );
}

type Mapping = (typeof LEDGER_MAPPINGS)[number];
type Posting = z.infer<typeof postingPreviewFormSchema>;

function Account({ side, name }: { side: "Dr" | "Cr"; name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      <span
        className={cn(
          "flex h-5 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
          side === "Dr" ? "bg-foreground text-background" : "bg-accent/20 text-foreground"
        )}
      >
        {side}
      </span>
      <span className="min-w-0">{name}</span>
    </span>
  );
}

function PostingPreview({ mapping }: { mapping: Mapping }) {
  const form = useForm<Posting>({
    resolver: zodResolver(postingPreviewFormSchema),
    defaultValues: { reference: "CC-1022", amount: 250000 },
  });
  const [validated, setValidated] = React.useState<(Posting & { mapping: Mapping }) | null>(null);
  const result = validated?.mapping.id === mapping.id ? validated : null;

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8 xl:sticky xl:top-24">
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => {
          if (!z.array(ledgerMappingSchema).safeParse(LEDGER_MAPPINGS).success) {
            toast.error("Invalid mapping. Debit and credit accounts must differ.");
            return;
          }
          setValidated({ ...values, mapping });
        })}
      >
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title="Posting preview" note={`${mapping.event} · never posts to the ledger`} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <FinanceText form={form} name="reference" label="Posting reference" />
            <FinanceNumber form={form} name="amount" label="Amount" prefix="₦" />
          </div>
        </div>
        {result && (
          <div role="status" className="flex flex-col gap-3 border-t border-border p-5">
            <ul className="flex flex-col gap-2">
              {[
                { side: "Dr" as const, name: result.mapping.debitAccount },
                { side: "Cr" as const, name: result.mapping.creditAccount },
              ].map((line) => (
                <li key={line.side} className="flex items-center justify-between gap-3">
                  <Account side={line.side} name={line.name} />
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{money(result.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
              <CheckMark ok label={`Balanced · difference ${money(0)}`} />
              <span className="text-xs text-muted-foreground">{result.reference}</span>
            </div>
          </div>
        )}
        <div className="border-t border-border bg-muted/40 p-5">
          <Button type="submit" variant="outline" className="h-10 w-full rounded-full">
            Validate posting
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LedgerTab() {
  const [selected, setSelected] = React.useState(LEDGER_MAPPINGS[0].id);
  const mapping = LEDGER_MAPPINGS.find((m) => m.id === selected) ?? LEDGER_MAPPINGS[0];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Chart-of-accounts mapping" note="Double entry · select an event to preview its posting">
          <StatusPill tone="muted">Draft</StatusPill>
        </CardHeader>
        <ul className="flex flex-col gap-2">
          {LEDGER_MAPPINGS.map((m) => {
            const active = m.id === selected;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(m.id)}
                  className={cn(
                    "grid w-full gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] md:items-center",
                    active ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm font-semibold">{m.event}</span>
                  <Account side="Dr" name={m.debitAccount} />
                  <Account side="Cr" name={m.creditAccount} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Every event debits one account and credits another for the same amount. Debit and credit must differ.
        </p>
      </Card>
      <PostingPreview mapping={mapping} />
    </div>
  );
}

type Retry = (typeof BANKING_RETRIES)[number];
const RETRY_STATE: Record<Retry["state"], { tone: Tone; label: string }> = {
  blocked: { tone: "danger", label: "Blocked" },
  "review-before-retry": { tone: "warning", label: "Verify" },
};

function RetriesTab() {
  const [selectedId, setSelectedId] = React.useState(BANKING_RETRIES[0].id);
  const selected = BANKING_RETRIES.find((r) => r.id === selectedId) ?? BANKING_RETRIES[0];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Posting & sync retries" note="Illustrative failed records · no live retry available" />
        <ul className="flex flex-col gap-2">
          {BANKING_RETRIES.map((r) => {
            const active = r.id === selectedId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="w-20 shrink-0 font-mono text-xs font-semibold">{r.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.operation}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.failure} · next: {r.nextStep.toLowerCase()}
                    </span>
                  </span>
                  <StatusPill tone={RETRY_STATE[r.state].tone}>{RETRY_STATE[r.state].label}</StatusPill>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs/5 text-muted-foreground">
          Original references and idempotency keys must be preserved. A timeout doesn&apos;t prove the posting failed,
          so retries stay blocked until the original status is verified.
        </p>
      </Card>

      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8 xl:sticky xl:top-24">
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title={selected.id} note={selected.operation}>
            <StatusPill tone={RETRY_STATE[selected.state].tone}>{RETRY_STATE[selected.state].label}</StatusPill>
          </CardHeader>
          <DetailList
            rows={[
              ["Failure", selected.failure],
              ["Next step", selected.nextStep],
              [
                "Original reference",
                <span key="ref" className="font-mono text-xs">
                  {selected.originalReference}
                </span>,
              ],
              [
                "Idempotency key",
                <span key="key" className="font-mono text-xs">
                  {selected.idempotencyKey}
                </span>,
              ],
            ]}
          />
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Masked payload</p>
            <pre className="overflow-x-auto rounded-xl bg-[#121212] p-4 text-xs/6 text-white/80">
              {JSON.stringify(
                {
                  reference: selected.originalReference,
                  operation: selected.operation,
                  idempotencyKey: selected.idempotencyKey,
                  environment: "sandbox",
                  state: selected.state,
                },
                null,
                2
              )}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              No credentials, full account numbers or identity numbers included.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-5">
          <Button variant="outline" className="h-10 rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Query original status
          </Button>
          <Button className="h-10 rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Retry idempotent posting
          </Button>
        </div>
      </Card>
    </div>
  );
}

type View = "connection" | "ledger" | "customers" | "retries";
const KINDS = ["banking-config", "environment-review"];

function StatusCard({ configSaved }: { configSaved: boolean }) {
  const steps = [
    { label: "Configuration draft", done: configSaved },
    { label: "Independent approval", done: false },
    { label: "Sandbox connection test", done: false },
    { label: "Scheduled sync", done: false },
  ];
  const done = steps.filter((s) => s.done).length;
  const blocked = BANKING_RETRIES.filter((r) => r.state === "blocked").length;
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Symplus integration</p>
          <p className="mt-2 text-4xl font-light md:text-5xl">Not connected</p>
          <p className="mt-2 text-xs text-white/50">No endpoint has been contacted · all records below are previews</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Sandbox
        </span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <p className="text-xs text-white/60">
          Setup · {done} of {steps.length}
        </p>
        <ol className="grid gap-2 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-2">
              <span aria-hidden className={cn("h-1 rounded-full", s.done ? "bg-accent" : "bg-white/15")} />
              <span className={cn("text-xs", s.done ? "text-white" : "text-white/50")}>
                {i + 1}. {s.label}
                <span className="sr-only">{s.done ? " · done" : " · not done"}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Ledger events", value: LEDGER_MAPPINGS.length, note: "mapped · draft" },
          { label: "Retry queue", value: BANKING_RETRIES.length, note: `${blocked} blocked` },
          { label: "Last sync", value: "Never", note: "unconfigured" },
        ].map(({ label, value, note }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-white/60">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
            <dd className="truncate text-xs text-white/50">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProductionCard({ reviews }: { reviews: Reviews }) {
  const { requests, submit, ready } = reviews;
  const open = requests.filter((r) => KINDS.includes(r.kind));
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Production access" note="Locked · needs a separate approved change" />
      <ul className="flex flex-col gap-2">
        {["Approved change request", "Dual review", "Connection validation"].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm">
            <HugeiconsIcon icon={LockIcon} aria-hidden className="size-4 text-muted-foreground" />
            {item}
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        className="h-10 rounded-full"
        disabled={!ready}
        onClick={() =>
          reviewBatch({
            title: "Request environment review",
            batchId: "SYMPLUS-PRODUCTION",
            content: (
              <Notice>
                This records a local review request only. It doesn&apos;t switch environments, expose credentials or
                contact a production endpoint.
              </Notice>
            ),
            onSave: (v) =>
              submit({
                kind: "environment-review",
                subjectId: "symplus-production",
                summary: "Production environment review",
                reason: v.reason,
                details: { checkerId: v.checkerId, environment: "production" },
              }),
          })
        }
      >
        Request environment review
      </Button>
      <div className="flex flex-col border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Your requests</p>
        {open.length ? (
          <ul className="flex flex-col">
            {open.map((r) => (
              <li key={r.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-none">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.summary}</span>
                  <span className="block truncate text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </span>
                <StatusPill tone="warning">Pending</StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 py-2.5 text-sm text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-4" />
            Nothing submitted yet
          </p>
        )}
      </div>
    </Card>
  );
}

function CustomersTab() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title="Customer linkage" note="One Symplus customer per verified investor">
            <StatusPill tone="danger">Blocked</StatusPill>
          </CardHeader>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <Initials name="Ada Okafor" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Ada Okafor</span>
              <span className="block text-xs text-muted-foreground">CC-U014</span>
            </span>
          </div>
          <DetailList
            rows={[
              ["Symplus reference", "Not linked"],
              ["KYC eligibility", "Awaiting complete verification"],
              ["Linkage state", "Blocked · unconfigured"],
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border bg-muted/40 p-5">
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-full"
            onClick={() =>
              AppModal.open({
                title: "Customer linkage requirements",
                content: (
                  <Notice>
                    Complete investor KYC, verify customer identity and approve the sandbox connection first. The server
                    must then create an idempotent customer link and retain the returned reference. No customer data has
                    been sent.
                  </Notice>
                ),
              })
            }
          >
            Requirements
          </Button>
          <Button className="h-10 flex-1 rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Create link
          </Button>
        </div>
      </Card>

      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title="Balance sync" note="Wallet vs core banking · sandbox preview" />
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
            {[
              { label: "City Core wallet", value: money(1250000), muted: false },
              { label: "Symplus balance", value: "Unavailable", muted: true },
            ].map((b) => (
              <div key={b.label} className="bg-card p-4">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className={cn("mt-1 text-2xl font-light tabular-nums", b.muted && "text-muted-foreground")}>
                  {b.value}
                </p>
              </div>
            ))}
          </div>
          <DetailList
            rows={[
              ["Variance", "Not calculated"],
              ["Last successful sync", "Never · unconfigured"],
            ]}
          />
          <p className="text-xs/5 text-muted-foreground">
            Never overwrite the wallet from an unverified remote balance. Differences create reconciliation exceptions.
          </p>
        </div>
        <div className="border-t border-border bg-muted/40 p-5">
          <Button className="h-10 w-full rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Run sandbox balance query
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function BankingPage() {
  const reviews = useReviewRequests();
  const [view, setView] = React.useState<View>("connection");
  const configSaved = reviews.requests.some((r) => r.kind === "banking-config");

  return (
    <>
      <Link
        href="/platform"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        Platform configuration
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Core banking</h1>
          <p className="text-sm text-muted-foreground">
            Symplus connection, ledger mapping and sync · no live banking connection
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4"
          nativeButton={false}
          render={<Link href="/withdrawals" />}
        >
          Treasury & withdrawals
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Button>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <StatusCard configSaved={configSaved} />
        <ProductionCard reviews={reviews} />
      </div>

      <FilterChips
        label="Workspace"
        value={view}
        onChange={setView}
        options={[
          { value: "connection", label: "Connection" },
          { value: "ledger", label: "Ledger mapping", count: LEDGER_MAPPINGS.length },
          { value: "customers", label: "Customers & balances" },
          { value: "retries", label: "Retry queue", count: BANKING_RETRIES.length },
        ]}
      />
      <div hidden={view !== "connection"}>
        <ConnectionTab reviews={reviews} />
      </div>
      <div hidden={view !== "ledger"}>
        <LedgerTab />
      </div>
      {view === "customers" && <CustomersTab />}
      {view === "retries" && <RetriesTab />}
    </>
  );
}
