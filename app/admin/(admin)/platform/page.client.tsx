"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { type PlatformState, adminPlatformStateSchema } from "@/constant/schemas/admin-platform";
import { ArrowRight01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { toast } from "sonner";

import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { AS_OF } from "../account/_data";
import { FilterChips, StatusPill } from "../account/_ui";
import { CardHeader } from "../content/_ui";
import { DetailList, Initials } from "../users/_ui";
import { CONFIG_HISTORY } from "./_data";
import { PLATFORM_DEFAULTS } from "./_data";
import { MaintenanceCard, watDate } from "./_maintenance";
import { FeeMatrix, isEdited } from "./_matrix";

type Update = <K extends keyof PlatformState>(key: K, next: PlatformState[K]) => void;
const APPROVERS = [
  { value: "staff-nneka", name: "Nneka Eze" },
  { value: "staff-amaka", name: "Amaka Obi" },
] as const;
const READINESS = ["Approved credentials", "Verified integrations", "Dual review", "Change request"];
const DATE_FORMATS = ["DD MMM YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const;

function sampleDate(format: PlatformState["dateFormat"]) {
  const [y, m, d] = AS_OF.split("-");
  if (format === "DD/MM/YYYY") return `${d}/${m}/${y}`;
  if (format === "YYYY-MM-DD") return AS_OF;
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
    new Date(`${AS_OF}T00:00:00Z`)
  );
  return `${d} ${month} ${y}`;
}

function openReadiness() {
  AppModal.open({
    title: "Production readiness review",
    description: "Sandbox stays active",
    content: (
      <div className="space-y-4">
        <p className="text-sm/6">
          Production needs approved credentials, verified integrations, an independent reviewer and a recorded
          environment change request.
        </p>
        <Notice>
          Review core banking before requesting production access. This preview doesn&apos;t switch environments.
        </Notice>
        <Button
          variant="outline"
          className="rounded-full"
          nativeButton={false}
          render={<Link href="/platform/banking" />}
        >
          Review core banking
        </Button>
      </div>
    ),
  });
}

function EnvironmentCard({ value }: { value: PlatformState }) {
  const edited = value.matrix.filter(isEdited).length;
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Active environment</p>
          <p className="mt-2 text-4xl font-light md:text-5xl">Sandbox</p>
          <p className="mt-2 text-xs text-white/50">No live connection · production switch locked</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", value.status === "pending" ? "bg-white" : "bg-accent")}
          />
          {value.status === "pending" ? "v2.4 awaiting review" : "Draft v2.4"}
        </span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <p className="text-xs text-white/60">Production readiness · 0 of {READINESS.length}</p>
        <ul className="flex flex-wrap gap-2">
          {READINESS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2.5 text-xs ring-1 ring-white/10"
            >
              <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3.5 shrink-0 text-white/50" />
              <span className="truncate text-white/80">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
        <dl className="grid flex-1 grid-cols-3 gap-4">
          {[
            { label: "Fee rules", value: value.matrix.length, note: edited ? `${edited} edited` : "unchanged" },
            {
              label: "Maintenance",
              value: value.maintenance ? "Scheduled" : "Off",
              note: value.maintenance ? watDate(value.windowStart) : "no window set",
            },
            { label: "Timezone", value: "WAT", note: "UTC+1 · Lagos" },
          ].map(({ label, value: v, note }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-white/60">{label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{v}</dd>
              <dd className="truncate text-xs text-white/50">{note}</dd>
            </div>
          ))}
        </dl>
        <Button className="h-10 rounded-full bg-white px-4 text-[#121212] hover:bg-white/90" onClick={openReadiness}>
          Readiness review
        </Button>
      </div>
    </section>
  );
}

function LocaleCard({ value, update }: { value: PlatformState; update: Update }) {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Locale" note="How money and dates appear to investors" />
      <DetailList
        rows={[
          ["Currency", "NGN · Nigerian naira"],
          ["Timezone", "Africa/Lagos · WAT"],
        ]}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Date format</p>
        <FilterChips
          label="Date format"
          value={value.dateFormat}
          onChange={(v) => update("dateFormat", v)}
          options={DATE_FORMATS.map((f) => ({ value: f, label: f }))}
        />
      </div>
      <div className="mt-auto rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Today appears as</p>
        <p className="mt-1 text-2xl font-light tabular-nums">{sampleDate(value.dateFormat)}</p>
      </div>
    </Card>
  );
}

function ReviewCard({
  value,
  update,
  persist,
  saved,
}: {
  value: PlatformState;
  update: Update;
  persist: (status: "draft" | "pending") => void;
  saved: boolean;
}) {
  const pending = value.status === "pending";
  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-1 border-b border-border p-5">
        <CardHeader title="Review & approval" note="Maker Tunde Bello · effective only after approval">
          <StatusPill tone={pending ? "warning" : "muted"}>{pending ? "Awaiting review" : "Draft"}</StatusPill>
        </CardHeader>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <TextAreaField
          id="platform-reason"
          label="Reason for change"
          value={value.reason}
          onChange={(v) => update("reason", v)}
          rows={3}
        />
        <TextField
          id="platform-reference"
          label="Change reference"
          value={value.reference}
          onChange={(v) => update("reference", v)}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Independent approver</legend>
          <div role="radiogroup" className="flex flex-col gap-1.5">
            {APPROVERS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={value.approver === a.value}
                onClick={() => update("approver", a.value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  value.approver === a.value ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                )}
              >
                <Initials name={a.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">Super Admin</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={value.reviewed} onCheckedChange={(v) => update("reviewed", v === true)} />I reviewed the
          fee impact and investor-facing notices.
        </label>
        {saved && (
          <p role="status" className="rounded-xl bg-success/10 px-3 py-2.5 text-xs/5 text-success">
            {pending ? "Review request saved" : "Draft saved"} · {value.reference}. Nothing live has changed.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-5">
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 flex-1 rounded-full" onClick={() => persist("draft")}>
            Save draft
          </Button>
          <Button className="h-10 flex-1 rounded-full" disabled={pending} onClick={() => persist("pending")}>
            Submit
          </Button>
        </div>
        <Button variant="ghost" className="h-10 rounded-full" disabled>
          <HugeiconsIcon icon={LockIcon} aria-hidden />
          Activate in production
        </Button>
      </div>
    </Card>
  );
}

function HistoryCard({ status }: { status: PlatformState["status"] }) {
  const items = [
    {
      version: "v2.4",
      change: "Fee / limit alignment",
      actor: "Tunde Bello",
      approval: status === "pending" ? "Awaiting review" : "Draft",
      effective: "Not active",
      current: true,
    },
    ...CONFIG_HISTORY.map((h) => ({ ...h, approval: "Approved", current: false })),
  ];
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Configuration history" note="Read only · every version keeps its approval record" />
      <ol className="flex flex-col">
        {items.map((item) => (
          <li key={item.version} className="relative flex gap-3 pb-5 last:pb-0">
            <span aria-hidden className="flex flex-col items-center pt-1">
              <span
                className={cn("size-2.5 rounded-full ring-4 ring-card", item.current ? "bg-accent" : "bg-foreground")}
              />
              <span className="mt-1 w-px flex-1 bg-border [li:last-child_&]:hidden" />
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.version} · {item.change}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.actor} · {item.current ? "effective only after approval" : `effective ${item.effective}`}
                </span>
              </span>
              <StatusPill tone={item.current ? (status === "pending" ? "warning" : "muted") : "success"}>
                {item.approval}
              </StatusPill>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Configuration({ initialValue, save }: { initialValue: PlatformState; save: (v: PlatformState) => boolean }) {
  const [value, setValue] = React.useState(initialValue);
  const [saved, setSaved] = React.useState(false);
  const update: Update = (key, next) => {
    setValue((current) => ({ ...current, [key]: next, status: "draft" }));
    setSaved(false);
  };
  const persist = (status: "draft" | "pending") => {
    const next = { ...value, status };
    if (save(next)) {
      setValue(next);
      setSaved(true);
      toast.success(status === "pending" ? "Submitted for review in this browser" : "Configuration draft saved");
    }
  };

  return (
    <>
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <EnvironmentCard value={value} />
        <LocaleCard value={value} update={update} />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <FeeMatrix matrix={value.matrix} onChange={(m) => update("matrix", m)} />
          <MaintenanceCard value={value} update={update} />
          <HistoryCard status={value.status} />
        </div>
        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-24">
          <ReviewCard value={value} update={update} persist={persist} saved={saved} />
        </div>
      </div>
    </>
  );
}

export function PlatformPage() {
  const store = usePreviewState("citycore-admin-platform-v1", adminPlatformStateSchema, PLATFORM_DEFAULTS);
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Platform configuration</h1>
          <p className="text-sm text-muted-foreground">
            Fees, limits, locale and maintenance · drafts never change production
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4"
          nativeButton={false}
          render={<Link href="/platform/banking" />}
        >
          Core banking
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Button>
      </header>
      {store.ready ? (
        <Configuration initialValue={store.value} save={store.save} />
      ) : (
        <>
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </>
      )}
    </>
  );
}
