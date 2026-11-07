"use client";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type GrowthDraft, adminGrowthStateSchema } from "@/constant/schemas/admin-growth";
import { cn } from "cn";
import { toast } from "sonner";

import { money } from "../_operations/treasury-ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips } from "../account/_ui";
import { CardHeader } from "../content/_ui";
import { BroadcastTab, SmsTab } from "./_broadcast";
import { GROWTH_DEFAULTS } from "./_data";
import { ORGANIC, PromoTab, REFERRERS, ReferralsTab } from "./_referrals";
import { AUDIENCE, ApprovalPill, type Draft, type Status } from "./_ui";

type View = "referrals" | "promo" | "broadcast" | "sms";
const FIELD_STATUS: Record<Status, (keyof GrowthDraft)[]> = {
  incentiveStatus: ["program", "reward", "qualification", "cap", "attribution", "link", "review"],
  promoStatus: ["code", "benefit", "validity", "limits", "eligibility"],
  broadcastStatus: ["subject", "body", "cta", "channel", "template", "audience", "schedule", "owner"],
  smsStatus: ["sms"],
};
const APPROVALS: { status: Status; view: View; label: string; note: (d: GrowthDraft) => string }[] = [
  { status: "incentiveStatus", view: "referrals", label: "Referral rule", note: (d) => d.reward },
  { status: "promoStatus", view: "promo", label: "Promo code", note: (d) => `${d.code} · ${d.benefit}` },
  { status: "broadcastStatus", view: "broadcast", label: "Broadcast", note: (d) => d.subject },
  { status: "smsStatus", view: "sms", label: "Bulk SMS", note: () => `${AUDIENCE.eligible} opted-in recipients` },
];

function ProgramCard({ draft }: { draft: GrowthDraft }) {
  const qualified = REFERRERS.reduce((t, r) => t + r.qualified, 0);
  const attributed = REFERRERS.reduce((t, r) => t + r.attributed, 0);
  const rewards = REFERRERS.reduce((t, r) => t + r.reward, 0);
  const groups = [
    { key: "qualified", label: "Qualified", value: qualified, color: "bg-accent" },
    { key: "attributed", label: "Attributed, not yet qualified", value: attributed - qualified, color: "bg-white/40" },
    { key: "organic", label: "Organic", value: ORGANIC, color: "bg-white/15" },
  ];
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Qualified referrals · {draft.program}</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{qualified}</p>
          <p className="mt-2 text-xs text-white/50 tabular-nums">
            of {attributed} sign-ups attributed to a referral code
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{draft.attribution}</span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <div aria-hidden className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/10">
          {groups.map((g) => (
            <span key={g.key} className={cn("h-full rounded-full", g.color)} style={{ flexGrow: g.value }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {groups.map((g) => (
            <p key={g.key} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-2 rounded-full", g.color)} />
              <span className="text-white/60">{g.label}</span>
              <span className="font-semibold tabular-nums">{g.value}</span>
            </p>
          ))}
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Rewards pending", value: money(rewards), note: "awaiting fraud review" },
          { label: "Broadcast reach", value: AUDIENCE.eligible, note: "opted-in investors" },
          { label: "Promo code", value: draft.code, note: "not redeemable yet" },
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

function ApprovalsCard({ draft, onOpen }: { draft: GrowthDraft; onOpen: (view: View) => void }) {
  const pending = APPROVALS.filter((a) => draft[a.status] === "pending").length;
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Approvals" note={`${pending} of ${APPROVALS.length} submitted · nothing goes live here`} />
      <ul className="flex flex-col">
        {APPROVALS.map((a) => (
          <li key={a.status}>
            <button
              type="button"
              onClick={() => onOpen(a.view)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.note(draft)}</span>
              </span>
              <ApprovalPill status={draft[a.status]} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Workspace({
  initialValue,
  save,
  ready,
}: {
  initialValue: GrowthDraft;
  save: (value: GrowthDraft) => boolean;
  ready: boolean;
}) {
  const [draft, setDraft] = React.useState(initialValue);
  const [view, setView] = React.useState<View>("referrals");

  const ctx: Draft = {
    draft,
    ready,
    update: (key, value) =>
      setDraft((current) => {
        const status = (Object.keys(FIELD_STATUS) as Status[]).find((s) => FIELD_STATUS[s].includes(key));
        return { ...current, [key]: value, ...(status ? { [status]: "draft" } : {}) };
      }),
    persist: (status) => {
      if (status === "incentiveStatus" && !draft.review) {
        toast.error("Turn on fraud & consent review before submitting");
        return;
      }
      const next = { ...draft, ...(status ? { [status]: "pending" } : {}) };
      if (save(next)) {
        setDraft(next);
        toast.success(status ? "Approval request saved in this browser. Nothing went live." : "Draft saved");
      }
    },
  };

  return (
    <>
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ProgramCard draft={draft} />
        <ApprovalsCard draft={draft} onOpen={setView} />
      </div>
      <FilterChips
        label="Workspace"
        value={view}
        onChange={setView}
        options={[
          { value: "referrals", label: "Referrals" },
          { value: "promo", label: "Promo codes" },
          { value: "broadcast", label: "Broadcast" },
          { value: "sms", label: "SMS" },
        ]}
      />
      {view === "referrals" && <ReferralsTab ctx={ctx} />}
      {view === "promo" && <PromoTab ctx={ctx} />}
      {view === "broadcast" && <BroadcastTab ctx={ctx} />}
      {view === "sms" && <SmsTab ctx={ctx} />}
    </>
  );
}

export function AdminGrowthPage() {
  const store = usePreviewState("citycore-admin-growth-v1", adminGrowthStateSchema, GROWTH_DEFAULTS);
  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Growth & broadcasts</h1>
        <p className="text-sm text-muted-foreground">
          Referrals, promo codes and investor messaging · every change needs approval before it goes live
        </p>
      </header>
      {store.ready ? (
        <Workspace initialValue={store.value} save={store.save} ready={store.ready} />
      ) : (
        <>
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </>
      )}
    </>
  );
}
