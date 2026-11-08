"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { type GrowthDraft, adminGrowthStateSchema } from "@/constant/schemas/admin-growth";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { toast } from "sonner";

import { money } from "../_operations/treasury-ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips, SegmentBar, StatusPill, type Tone } from "../account/_ui";
import { CardHeader, Section } from "../content/_ui";
import { Initials } from "../users/_ui";
import { GROWTH_DEFAULTS } from "./_data";

type Status = "incentiveStatus" | "promoStatus" | "broadcastStatus" | "smsStatus";
type Draft = {
  draft: GrowthDraft;
  update: (key: keyof GrowthDraft, value: string | boolean) => void;
  persist: (status?: Status) => void;
  ready: boolean;
};

const FOOTER = "Target returns are not guaranteed. Capital is at risk. Unsubscribe · Privacy";
const AUDIENCE = { segment: 420, suppressed: 108, eligible: 312 };

function DraftField({
  ctx,
  name,
  label,
  multiline = false,
  className,
}: {
  ctx: Draft;
  name: keyof GrowthDraft;
  label: string;
  multiline?: boolean;
  className?: string;
}) {
  const Component = multiline ? TextAreaField : TextField;
  return (
    <Component
      id={`growth-${name}`}
      label={label}
      value={String(ctx.draft[name])}
      onChange={(value) => ctx.update(name, value)}
      maxLength={name === "sms" ? 160 : 2000}
      className={className}
    />
  );
}

function ApprovalPill({ status }: { status: "draft" | "pending" }) {
  return status === "pending" ? (
    <StatusPill tone="warning">Awaiting approval</StatusPill>
  ) : (
    <StatusPill tone="muted">Draft</StatusPill>
  );
}

const CHANNELS = ["Email + dashboard banner", "Email", "Dashboard banner"];
const TEMPLATES = ["Market update · v1.2", "Offering announcement · v1.0"];
const SMS_RATE = 4;
type PreviewMode = "email" | "banner" | "push";

function AudienceFunnel() {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-muted/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">Eligible recipients</p>
        <p className="text-2xl font-light tabular-nums">{AUDIENCE.eligible}</p>
      </div>
      <SegmentBar
        className="h-2 bg-background"
        parts={[
          { key: "eligible", value: AUDIENCE.eligible, className: "bg-accent" },
          { key: "suppressed", value: AUDIENCE.suppressed, className: "bg-foreground/25" },
        ]}
      />
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {AUDIENCE.eligible} opted in
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-foreground/25" />
          {AUDIENCE.suppressed} suppressed or unsubscribed
        </span>
        <span>of {AUDIENCE.segment} in segment</span>
      </div>
    </div>
  );
}

function Composer({ ctx }: { ctx: Draft }) {
  const { draft, update, persist, ready } = ctx;
  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Broadcast composer" note="Content needs independent approval · nothing is sent">
          <ApprovalPill status={draft.broadcastStatus} />
        </CardHeader>
      </div>
      <Section step={1} title="Audience">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Channel</p>
          <FilterChips
            label="Channel"
            value={draft.channel}
            onChange={(v) => update("channel", v)}
            options={CHANNELS.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="growth-template"
            label="Template"
            value={draft.template}
            onChange={(v) => update("template", v)}
            items={TEMPLATES.map((t) => ({ value: t, label: t }))}
          />
          <DraftField ctx={ctx} name="audience" label="Segment" />
        </div>
        <AudienceFunnel />
      </Section>
      <Section step={2} title="Message">
        <DraftField ctx={ctx} name="subject" label="Subject / banner title" />
        <DraftField ctx={ctx} name="body" label="Body" multiline />
        <DraftField ctx={ctx} name="cta" label="Button label / destination" />
        <p className="text-xs/5 text-muted-foreground">
          The risk footer and unsubscribe link are added to every marketing message.
        </p>
      </Section>
      <Section step={3} title="Approval">
        <div className="grid gap-4 sm:grid-cols-2">
          <DraftField ctx={ctx} name="schedule" label="Schedule" />
          <DraftField ctx={ctx} name="owner" label="Approval owner" />
        </div>
      </Section>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
        <Button variant="ghost" className="h-10 rounded-full px-4" disabled>
          <HugeiconsIcon icon={LockIcon} aria-hidden />
          Send
        </Button>
        <Button variant="outline" className="h-10 rounded-full px-4" disabled={!ready} onClick={() => persist()}>
          Save draft
        </Button>
        <Button
          className="h-10 rounded-full px-5"
          disabled={!ready || draft.broadcastStatus === "pending"}
          onClick={() => persist("broadcastStatus")}
        >
          {draft.broadcastStatus === "pending" ? "Awaiting approval" : "Request approval"}
        </Button>
      </div>
    </Card>
  );
}

function Preview({ draft }: Draft) {
  const [mode, setMode] = React.useState<PreviewMode>("email");
  const cta = draft.cta.split("/")[0].trim();
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Preview" note={`${AUDIENCE.eligible} recipients · ${draft.template}`} />
      <FilterChips
        label="Preview format"
        value={mode}
        onChange={setMode}
        options={[
          { value: "email", label: "Email" },
          { value: "banner", label: "Banner" },
          { value: "push", label: "Push" },
        ]}
      />
      {mode === "email" && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/8">
          <div className="flex items-center justify-between bg-[#121212] px-5 py-3 text-xs text-white/70">
            <span className="font-semibold text-white">City Core</span>
            <span>{draft.template}</span>
          </div>
          <div className="flex flex-col gap-3 bg-card p-5">
            <p className="text-lg font-semibold">{draft.subject}</p>
            <p className="text-sm/6 text-muted-foreground">{draft.body}</p>
            <span className="mt-1 w-fit rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
              {cta}
            </span>
            <p className="border-t border-border pt-3 text-[11px]/4 text-muted-foreground">{FOOTER}</p>
          </div>
        </div>
      )}
      {mode === "banner" && (
        <div className="relative overflow-hidden rounded-2xl bg-[#121212] p-5 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-accent/30 blur-3xl"
          />
          <p className="relative text-xs text-white/60">Dashboard · for you</p>
          <p className="relative mt-2 text-base font-semibold">{draft.subject}</p>
          <p className="relative mt-1 line-clamp-2 text-xs/5 text-white/70">{draft.body}</p>
          <span className="relative mt-4 inline-block rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#121212]">
            {cta}
          </span>
        </div>
      )}
      {mode === "push" && (
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex gap-3 rounded-xl bg-card p-3 shadow-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#121212] text-xs font-semibold text-white">
              CC
            </span>
            <span className="min-w-0">
              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">City Core</span>now
              </span>
              <span className="block truncate text-sm font-semibold">{draft.subject}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{draft.body}</span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function SmsComposer({ ctx }: { ctx: Draft }) {
  const { draft, persist, ready } = ctx;
  const length = draft.sms.length;
  const cost = AUDIENCE.eligible * SMS_RATE;
  return (
    <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Bulk SMS" note="Consent-based audience · suppression list excluded">
        <ApprovalPill status={draft.smsStatus} />
      </CardHeader>
      <DraftField ctx={ctx} name="sms" label="Message" multiline />
      <div className="flex flex-col gap-2">
        <SegmentBar
          className="h-1.5 bg-muted"
          parts={[
            { key: "used", value: length, className: length > 150 ? "bg-warning" : "bg-accent" },
            { key: "left", value: Math.max(160 - length, 0), className: "bg-muted" },
          ]}
        />
        <p className={cn("text-xs tabular-nums", length > 150 ? "text-warning" : "text-muted-foreground")}>
          {length} / 160 characters · 1 segment
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-4 rounded-xl bg-muted/50 p-4">
        {[
          ["Recipients", AUDIENCE.eligible.toLocaleString()],
          ["Rate", `${money(SMS_RATE)} / SMS`],
          ["Estimated cost", money(cost)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
        <Button variant="outline" className="h-10 rounded-full px-4" disabled={!ready} onClick={() => persist()}>
          Save draft
        </Button>
        <Button
          className="h-10 rounded-full px-5"
          disabled={!ready || draft.smsStatus === "pending"}
          onClick={() =>
            AppModal.open({
              title: "Request SMS approval",
              description: `${AUDIENCE.eligible} opted-in recipients · estimated ${money(cost)}`,
              content: (
                <p className="rounded-xl bg-muted/60 p-4 text-sm/6">
                  {draft.sms}
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Saved in this browser only. No messages are sent.
                  </span>
                </p>
              ),
              primaryButton: { children: "Request approval", onClick: () => persist("smsStatus") },
              secondaryButton: { children: "Cancel" },
            })
          }
        >
          {draft.smsStatus === "pending" ? "Awaiting approval" : "Request approval"}
        </Button>
      </div>
    </Card>
  );
}

function PhonePreview({ sms }: { sms: string }) {
  return (
    <Card className="items-center gap-4 rounded-2xl px-5 py-6 ring-foreground/8">
      <div className="w-full max-w-64 rounded-[2rem] bg-[#121212] p-2.5 shadow-xl">
        <div className="flex min-h-80 flex-col gap-3 rounded-[1.6rem] bg-background p-4">
          <div className="mx-auto h-1 w-12 rounded-full bg-muted" />
          <p className="text-center text-xs font-semibold">CityCore</p>
          <p className="text-center text-[10px] text-muted-foreground">Text message · today</p>
          <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs/5 break-words">{sms}</p>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">Preview only · STOP opt-out is required</p>
    </Card>
  );
}

function BroadcastTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <Composer ctx={ctx} />
      <div className="xl:sticky xl:top-24">
        <Preview {...ctx} />
      </div>
    </div>
  );
}

function SmsTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <SmsComposer ctx={ctx} />
      <PhonePreview sms={ctx.draft.sms} />
    </div>
  );
}

const REFERRERS = [
  { name: "Ada Okafor", code: "ADA014", attributed: 6, qualified: 3, reward: 6000 },
  { name: "Lagos Partners", code: "AF020", attributed: 18, qualified: 8, reward: 16000 },
];
const ORGANIC = 42;
const PAYOUTS: { name: string; code: string; qualified: number; gross: number; state: string; tone: Tone }[] = [
  { name: "Lagos Partners", code: "AF020", qualified: 8, gross: 16000, state: "Fraud review", tone: "warning" },
  { name: "FCT Partners", code: "AF012", qualified: 5, gross: 10000, state: "Finance review", tone: "muted" },
];
const PAYOUT_TOTAL = PAYOUTS.reduce((total, p) => total + p.gross, 0);

function IncentiveCard({ ctx }: { ctx: Draft }) {
  const { draft, update, persist, ready } = ctx;
  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Referral rule" note="Rewards are wallet credits, never investment returns">
          <ApprovalPill status={draft.incentiveStatus} />
        </CardHeader>
      </div>
      <Section step={1} title="Program & reward">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="growth-program"
            label="Program"
            value={draft.program}
            onChange={(v) => update("program", v)}
            className="sm:col-span-2"
            items={["Investor referral · October", "Affiliate referral · October"].map((v) => ({ value: v, label: v }))}
          />
          <DraftField ctx={ctx} name="reward" label="Reward" />
          <DraftField ctx={ctx} name="cap" label="Per-referrer cap" />
        </div>
      </Section>
      <Section step={2} title="Qualification">
        <div className="grid gap-4 sm:grid-cols-2">
          <DraftField ctx={ctx} name="qualification" label="Qualifies when" className="sm:col-span-2" />
          <DraftField ctx={ctx} name="attribution" label="Attribution window" />
          <DraftField ctx={ctx} name="link" label="Sample code / link" />
        </div>
      </Section>
      <Section step={3} title="Safeguards">
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span>
            <span className="block font-semibold">Fraud & consent review</span>
            <span className="block text-xs text-muted-foreground">
              Excludes self-referrals and duplicate identities · required to submit
            </span>
          </span>
          <Switch
            checked={draft.review}
            onCheckedChange={(v) => update("review", v)}
            aria-label="Require fraud and consent review"
          />
        </label>
      </Section>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 p-5">
        <Button variant="outline" className="h-10 rounded-full px-4" disabled={!ready} onClick={() => persist()}>
          Save draft
        </Button>
        <Button
          className="h-10 rounded-full px-5"
          disabled={!ready || draft.incentiveStatus === "pending"}
          onClick={() => persist("incentiveStatus")}
        >
          {draft.incentiveStatus === "pending" ? "Awaiting approval" : "Submit rule"}
        </Button>
      </div>
    </Card>
  );
}

function ReferrersCard() {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Top referrers" note="October · qualified of attributed sign-ups" />
      <ul className="flex flex-col">
        {REFERRERS.map((r) => (
          <li key={r.code} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
            <Initials name={r.name} />
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{r.name}</span>
                <span className="text-sm font-semibold tabular-nums">{money(r.reward)}</span>
              </span>
              <SegmentBar
                className="h-1.5 bg-muted"
                parts={[
                  { key: "q", value: r.qualified, className: "bg-accent" },
                  { key: "a", value: r.attributed - r.qualified, className: "bg-muted" },
                ]}
              />
              <span className="block text-xs text-muted-foreground tabular-nums">
                {r.code} · {r.qualified} of {r.attributed} qualified
              </span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
          <span>Organic · no code</span>
          <span className="tabular-nums">{ORGANIC} sign-ups · no reward</span>
        </li>
      </ul>
    </Card>
  );
}

function PayoutsCard({ ctx }: { ctx: Draft }) {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Affiliate payouts" note="Platform expense · never investor principal">
        <StatusPill tone="muted">Not paid</StatusPill>
      </CardHeader>
      <div>
        <p className="text-3xl font-light tabular-nums">{money(PAYOUT_TOTAL)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {PAYOUTS.reduce((t, p) => t + p.qualified, 0)} qualified referrals across {PAYOUTS.length} affiliates
        </p>
      </div>
      <ul className="flex flex-col">
        {PAYOUTS.map((p) => (
          <li key={p.code} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {p.code} · {p.qualified} qualified · {money(p.gross)}
              </span>
            </span>
            <StatusPill tone={p.tone}>{p.state}</StatusPill>
          </li>
        ))}
      </ul>
      <DraftField ctx={ctx} name="memo" label="Payout memo" />
      <Button
        variant="outline"
        className="h-10 rounded-full"
        disabled={!ctx.ready}
        onClick={() =>
          AppModal.open({
            title: "Review affiliate payout batch",
            description: "Preview only · no funds move",
            content: (
              <div className="space-y-3 rounded-xl bg-muted/60 p-5 text-sm/6">
                {PAYOUTS.map((p) => (
                  <p key={p.code}>
                    {p.code} · {p.name}: {money(p.gross)} · {p.state.toLowerCase()}
                  </p>
                ))}
                <p className="font-semibold">Total {money(PAYOUT_TOTAL)}</p>
                <p className="text-muted-foreground">{ctx.draft.memo}</p>
                <p className="text-xs text-muted-foreground">Fraud and Finance approvals are required before payout.</p>
              </div>
            ),
          })
        }
      >
        Review {money(PAYOUT_TOTAL)} batch
      </Button>
    </Card>
  );
}

function PromoCard({ ctx }: { ctx: Draft }) {
  const { draft, persist, ready } = ctx;
  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Promo code" note="Not redeemable until approved">
          <ApprovalPill status={draft.promoStatus} />
        </CardHeader>
      </div>
      <Section step={1} title="Code & benefit">
        <div className="grid gap-4 sm:grid-cols-2">
          <DraftField ctx={ctx} name="code" label="Code" />
          <DraftField ctx={ctx} name="benefit" label="Benefit" />
        </div>
      </Section>
      <Section step={2} title="Rules">
        <div className="grid gap-4 sm:grid-cols-2">
          <DraftField ctx={ctx} name="validity" label="Validity" />
          <DraftField ctx={ctx} name="limits" label="Redemption limits" />
          <DraftField ctx={ctx} name="eligibility" label="Eligibility" className="sm:col-span-2" />
        </div>
      </Section>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 p-5">
        <Button variant="outline" className="h-10 rounded-full px-4" disabled={!ready} onClick={() => persist()}>
          Save draft
        </Button>
        <Button
          className="h-10 rounded-full px-5"
          disabled={!ready || draft.promoStatus === "pending"}
          onClick={() => persist("promoStatus")}
        >
          {draft.promoStatus === "pending" ? "Awaiting approval" : "Request approval"}
        </Button>
      </div>
    </Card>
  );
}

function CouponPreview({ draft }: Draft) {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="How investors see it" note="Wallet · promo code sheet" />
      <div className="relative overflow-hidden rounded-2xl bg-[#121212] p-5 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-16 size-48 rounded-full bg-accent/30 blur-3xl"
        />
        <p className="relative text-xs text-white/60">{draft.benefit}</p>
        <p className="relative mt-3 font-mono text-3xl tracking-[0.2em] break-all">{draft.code}</p>
        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-dashed border-white/20 pt-4 text-xs text-white/60">
          <span>{draft.validity}</span>
          <span>{draft.limits}</span>
        </div>
      </div>
      <p className="text-xs/5 text-muted-foreground">{draft.eligibility}</p>
    </Card>
  );
}

function ReferralsTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <IncentiveCard ctx={ctx} />
      <div className="flex min-w-0 flex-col gap-5">
        <ReferrersCard />
        <PayoutsCard ctx={ctx} />
      </div>
    </div>
  );
}

function PromoTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <PromoCard ctx={ctx} />
      <div className="xl:sticky xl:top-24">
        <CouponPreview {...ctx} />
      </div>
    </div>
  );
}

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

export default function AdminGrowthPage() {
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
