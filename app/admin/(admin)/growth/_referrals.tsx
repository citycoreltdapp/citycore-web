"use client";

import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { money } from "../_operations/treasury-ui";
import { SegmentBar, StatusPill, type Tone } from "../account/_ui";
import { CardHeader, Section } from "../content/_ui";
import { Initials } from "../users/_ui";
import { ApprovalPill, type Draft, DraftField } from "./_ui";

// ponytail: referral and payout rows are sample data until the growth API reports attribution.
export const REFERRERS = [
  { name: "Ada Okafor", code: "ADA014", attributed: 6, qualified: 3, reward: 6000 },
  { name: "Lagos Partners", code: "AF020", attributed: 18, qualified: 8, reward: 16000 },
];
export const ORGANIC = 42;
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

export function ReferralsTab({ ctx }: { ctx: Draft }) {
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

export function PromoTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <PromoCard ctx={ctx} />
      <div className="xl:sticky xl:top-24">
        <CouponPreview {...ctx} />
      </div>
    </div>
  );
}
