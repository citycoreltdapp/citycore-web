"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";

import { useReviewRequests } from "../../_operations/requests";
import { BANKING_RETRIES, LEDGER_MAPPINGS } from "../../_operations/treasury-data";
import { money, reviewBatch } from "../../_operations/treasury-ui";
import { Notice } from "../../_operations/ui";
import { FilterChips, StatusPill, formatDate } from "../../account/_ui";
import { CardHeader, type Reviews } from "../../content/_ui";
import { DetailList, Initials } from "../../users/_ui";
import { ConnectionTab } from "./_connection";
import { LedgerTab } from "./_ledger";
import { RetriesTab } from "./_retries";

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

export function BankingPage() {
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
