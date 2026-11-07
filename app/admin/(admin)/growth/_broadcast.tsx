"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

import { money } from "../_operations/treasury-ui";
import { FilterChips, SegmentBar } from "../account/_ui";
import { CardHeader, Section } from "../content/_ui";
import { AUDIENCE, ApprovalPill, type Draft, DraftField, FOOTER } from "./_ui";

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

export function BroadcastTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <Composer ctx={ctx} />
      <div className="xl:sticky xl:top-24">
        <Preview {...ctx} />
      </div>
    </div>
  );
}

export function SmsTab({ ctx }: { ctx: Draft }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <SmsComposer ctx={ctx} />
      <PhonePreview sms={ctx.draft.sms} />
    </div>
  );
}
