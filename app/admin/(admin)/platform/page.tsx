"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  type MatrixChange,
  type PlatformState,
  adminPlatformStateSchema,
  platformMatrixChangeSchema,
} from "@/constant/schemas/admin-platform";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FinanceNumber, money } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { AS_OF } from "../account/_data";
import { FilterChips, StatusPill } from "../account/page";
import { CardHeader } from "../content/page";
import { DetailList, Initials } from "../users/page";
import { CONFIG_HISTORY, PLATFORM_DEFAULTS } from "./_data";

const watDate = (v: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${v}:00+01:00`));
const validWindow = (v: string) => !!v && !Number.isNaN(Date.parse(`${v}:00+01:00`));

function MaintenanceCard({
  value,
  update,
}: {
  value: PlatformState;
  update: <K extends keyof PlatformState>(key: K, next: PlatformState[K]) => void;
}) {
  return (
    <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Maintenance mode" note="Scheduled downtime splash · activation needs approval">
        <StatusPill tone={value.maintenance ? "warning" : "muted"}>
          {value.maintenance ? "Scheduled in draft" : "Off"}
        </StatusPill>
      </CardHeader>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <span>
          <span className="block font-semibold">Schedule maintenance</span>
          <span className="block text-xs text-muted-foreground">
            Blocks new financial submissions during the window; support stays reachable
          </span>
        </span>
        <Switch
          checked={value.maintenance}
          onCheckedChange={(v) => update("maintenance", v)}
          aria-label="Schedule maintenance"
        />
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="maintenance-start"
              type="datetime-local"
              label="Starts · WAT"
              value={value.windowStart}
              onChange={(v) => update("windowStart", v)}
            />
            <TextField
              id="maintenance-end"
              type="datetime-local"
              label="Ends · WAT"
              value={value.windowEnd}
              onChange={(v) => update("windowEnd", v)}
            />
          </div>
          <TextField
            id="maintenance-headline"
            label="Headline"
            value={value.headline}
            onChange={(v) => update("headline", v)}
          />
          <TextAreaField
            id="maintenance-message"
            label="Message"
            value={value.message}
            onChange={(v) => update("message", v)}
            rows={3}
          />
        </div>

        <div className="relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#121212] p-6 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/2 size-64 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
          />
          <span className="relative rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">Splash preview</span>
          <p className="relative text-xl font-semibold">{value.headline}</p>
          <p className="relative max-w-xs text-sm/6 text-white/70">{value.message}</p>
          <p className="relative text-xs text-white/50 tabular-nums">
            {validWindow(value.windowEnd) ? `Back by ${watDate(value.windowEnd)} WAT` : "Choose when maintenance ends"}
          </p>
          <span className="relative mt-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#121212]">
            Contact support
          </span>
        </div>
      </div>
    </Card>
  );
}

type Row = PlatformState["matrix"][number];
type EditableRow = Row & { perTransaction: number; dailyLimit: number };

const isEditable = (row: Row): row is EditableRow => row.perTransaction !== null && row.dailyLimit !== null;
const isEdited = (row: Row) => {
  const base = PLATFORM_DEFAULTS.matrix.find((r) => r.operation === row.operation);
  return (
    !!base && (base.fee !== row.fee || base.perTransaction !== row.perTransaction || base.dailyLimit !== row.dailyLimit)
  );
};
const toChange = (row: EditableRow): MatrixChange => ({
  operation: row.operation as MatrixChange["operation"],
  fee: row.fee,
  perTransaction: row.perTransaction,
  dailyLimit: row.dailyLimit,
});

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "label",
    enableSorting: false,
    header: "Operation",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          {row.original.label}
          {isEdited(row.original) && <StatusPill tone="warning">Edited</StatusPill>}
        </p>
        <p className="text-xs">{row.original.eligibility}</p>
      </div>
    ),
  },
  {
    accessorKey: "fee",
    enableSorting: false,
    header: () => <span className="block text-right">Fee</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold text-foreground tabular-nums">
        {row.original.fee ? money(row.original.fee) : "Free"}
      </span>
    ),
  },
  {
    accessorKey: "perTransaction",
    enableSorting: false,
    header: () => <span className="block text-right">Per transaction</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.perTransaction === null ? "Available units" : money(row.original.perTransaction)}
      </span>
    ),
  },
  {
    accessorKey: "dailyLimit",
    enableSorting: false,
    header: () => <span className="block text-right">Daily limit</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original.dailyLimit === null ? "Wallet balance" : money(row.original.dailyLimit)}
      </span>
    ),
  },
];

function EditForm({ row, onApply }: { row: EditableRow; onApply: (change: MatrixChange) => void }) {
  const form = useForm<MatrixChange>({
    resolver: zodResolver(platformMatrixChangeSchema),
    defaultValues: toChange(row),
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(onApply)} className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="text-muted-foreground">Editing</span> <span className="font-semibold">{row.label}</span>
        </p>
        {isEdited(row) && <span className="text-xs text-warning">Changed from the live configuration</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FinanceNumber form={form} name="fee" label="Flat fee" prefix="₦" />
        <FinanceNumber form={form} name="perTransaction" label="Per transaction" prefix="₦" />
        <FinanceNumber form={form} name="dailyLimit" label="Daily limit" prefix="₦" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs/5 text-muted-foreground">
          The strictest of tier, balance and global limit applies. High-value withdrawals still go through treasury
          approval.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-9 rounded-full px-3.5" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" variant="outline" className="h-9 rounded-full px-4">
            Apply to draft
          </Button>
        </div>
      </div>
    </form>
  );
}

function FeeMatrix({ matrix, onChange }: { matrix: Row[]; onChange: (matrix: Row[]) => void }) {
  const [selected, setSelected] = React.useState("withdrawal");
  const row = matrix.find((r) => r.operation === selected);
  const edited = matrix.filter(isEdited).length;

  return (
    <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader
        title="Fees & limits"
        note={`NGN · ${edited ? `${edited} change${edited === 1 ? "" : "s"} in draft` : "matches live configuration"} · select a row to edit`}
      />
      <DataTable
        columns={columns}
        data={matrix}
        getRowId={(r) => r.operation}
        showPagination={false}
        onRowClick={(r) => {
          if (isEditable(r)) setSelected(r.operation);
          else toast.info(`${r.label} is limited by available units, not a fixed amount`);
        }}
        rowClassName="border-none even:bg-muted/50 hover:bg-muted"
      />
      {row && isEditable(row) && (
        <EditForm
          key={`${row.operation}-${row.fee}-${row.perTransaction}-${row.dailyLimit}`}
          row={row}
          onApply={(change) => {
            onChange(matrix.map((r) => (r.operation === change.operation ? { ...r, ...change } : r)));
            toast.success(`${row.label} updated in the draft`);
          }}
        />
      )}
    </Card>
  );
}

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
          render={<Link href="/admin/platform/banking" />}
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

export default function PlatformPage() {
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
          render={<Link href="/admin/platform/banking" />}
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
