"use client";

import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type GrowthDraft, adminGrowthStateSchema } from "@/constant/schemas/admin-growth";
import { toast } from "sonner";

import { Notice, PageTitle, Panel } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { GROWTH_DEFAULTS } from "./_data";

const footer = "Target returns are not guaranteed. Capital is at risk. Unsubscribe · Privacy";
function GrowthTable({ headings, rows }: { headings: string[]; rows: string[][] }) {
  return (
    <DataTable
      showPagination={false}
      data={rows}
      columns={headings.map((header, index) => ({ id: header, header, accessorFn: (row: string[]) => row[index] }))}
      cellClassName="align-top whitespace-normal"
    />
  );
}
export function AdminGrowthPage() {
  const store = usePreviewState("citycore-admin-growth-v1", adminGrowthStateSchema, GROWTH_DEFAULTS);
  return (
    <>
      <PageTitle
        title="Growth & Broadcast"
        description="Referral attribution, promotion rules and approved audience communications."
      />
      <Workspace
        key={store.ready ? "ready" : "loading"}
        initialValue={store.value}
        save={store.save}
        ready={store.ready}
      />
    </>
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
  const [draft, setDraft] = useState(initialValue);
  function update(key: keyof GrowthDraft, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(["subject", "body", "cta", "channel", "template", "audience", "schedule", "owner"].includes(key)
        ? { broadcastStatus: "draft" as const }
        : {}),
      ...(["code", "benefit", "validity", "limits", "eligibility"].includes(key)
        ? { promoStatus: "draft" as const }
        : {}),
      ...(["program", "reward", "qualification", "cap", "attribution", "link", "review"].includes(key)
        ? { incentiveStatus: "draft" as const }
        : {}),
      ...(key === "sms" ? { smsStatus: "draft" as const } : {}),
    }));
  }
  function persist(status?: "incentiveStatus" | "promoStatus" | "broadcastStatus" | "smsStatus") {
    if (status === "incentiveStatus" && !draft.review) {
      toast.error("Enable fraud & consent review before submitting");
      return;
    }
    const next = { ...draft, ...(status ? { [status]: "pending" } : {}) };
    if (save(next)) {
      setDraft(next);
      toast.success(
        status
          ? "Approval request saved in this browser preview. No live submission was made."
          : "Draft saved in this browser"
      );
    }
  }
  function field(label: string, key: keyof GrowthDraft, wide = false, multiline = false) {
    const Component = multiline ? TextAreaField : TextField;
    return (
      <Component
        id={`growth-${key}`}
        label={label}
        value={String(draft[key])}
        onChange={(value) => update(key, value)}
        maxLength={key === "sms" ? 160 : 2000}
        className={wide ? "sm:col-span-2" : undefined}
      />
    );
  }
  function select(label: string, key: keyof GrowthDraft, options: string[]) {
    return (
      <SelectField
        id={`growth-${key}`}
        label={label}
        value={String(draft[key])}
        onChange={(value) => update(key, value)}
        items={options.map((value) => ({ value, label: value }))}
      />
    );
  }
  function action(label: string, onClick: () => void, primary = false, disabled = false) {
    return (
      <Button type="button" variant={primary ? "default" : "secondary"} onClick={onClick} disabled={!ready || disabled}>
        {label}
      </Button>
    );
  }
  function preview(kind: string) {
    AppModal.open({
      title: `${kind} preview`,
      description: "Illustrative audience · 312 opted-in recipients. No messages will be sent.",
      content: (
        <div className="space-y-3 rounded-xl bg-muted/60 p-5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
          <h3>{kind === "SMS" ? "City Core" : draft.subject}</h3>
          <p>{kind === "SMS" ? draft.sms : draft.body}</p>
          <small>{footer}</small>
        </div>
      ),
    });
  }
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <div className="min-w-0 space-y-5">
        <Panel title="Referral & incentive rules" description="Draft program • rewards are not investment returns">
          <div className="grid gap-4 sm:grid-cols-2">
            {select("Program", "program", ["Investor referral · October", "Affiliate referral · October"])}
            {field("Referral reward", "reward")}
            {field("Qualification", "qualification", true)}
            {field("Per-referrer cap", "cap")}
            {field("Attribution window", "attribution")}
            {field("Sample code / link", "link", true)}
          </div>
          <label className="flex items-center justify-between gap-4 text-sm [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground [&_strong]:block [&_strong]:font-medium">
            <span>
              <strong>Require fraud &amp; consent review</strong>
              <small>Self-referrals and duplicate identities excluded</small>
            </span>
            <Switch
              checked={draft.review}
              onCheckedChange={(v) => update("review", v)}
              aria-label="Require fraud and consent review"
            />
          </label>
          {action(
            draft.incentiveStatus === "pending" ? "Incentive rule awaiting review" : "Submit incentive rule",
            () => persist("incentiveStatus"),
            false,
            draft.incentiveStatus === "pending"
          )}
          <GrowthTable
            headings={["Referrer", "Attributed", "Qualified", "Reward state"]}
            rows={[
              ["Ada · ADA014", "6", "3", "₦6,000 pending review"],
              ["Affiliate · AF020", "18", "8", "₦16,000 pending review"],
              ["Organic / no code", "42", "—", "No referral reward"],
            ]}
          />
        </Panel>
        <Panel title="Promo code engine">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Code", "code")}
            {field("Benefit", "benefit")}
            {field("Validity", "validity")}
            {field("Redemption limits", "limits")}
            {field("Eligibility", "eligibility", true)}
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            {draft.promoStatus === "pending" ? "Pending approval · not redeemable" : "Draft · not redeemable"}
          </Badge>
          {action(
            draft.promoStatus === "pending" ? "Awaiting approval" : "Validate & request approval",
            () => persist("promoStatus"),
            false,
            draft.promoStatus === "pending"
          )}
        </Panel>
        <Panel title="Affiliate payouts" description="Separate platform expense • no investor principal used">
          <GrowthTable
            headings={["Affiliate", "Qualified referrals", "Gross", "Approval"]}
            rows={[
              ["AF020 · Lagos Partners", "8", "₦16,000", "Pending fraud review"],
              ["AF012 · FCT Partners", "5", "₦10,000", "Pending Finance"],
              ["Total", "13", "₦26,000", "Not paid"],
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">{field("Payout memo", "memo", true)}</div>
          {action("Review ₦26,000 batch", () =>
            AppModal.open({
              title: "Review affiliate payout batch",
              description: "Preview only · no funds will be moved",
              content: (
                <div className="space-y-3 rounded-xl bg-muted/60 p-5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                  <p>AF020 · Lagos Partners: ₦16,000 — pending fraud review</p>
                  <p>AF012 · FCT Partners: ₦10,000 — pending Finance</p>
                  <p>Total: ₦26,000 · 13 qualified referrals</p>
                  <p>{draft.memo}</p>
                  <small>
                    Fraud and Finance approvals are required before payout. Separate platform expense; no investor
                    principal used.
                  </small>
                </div>
              ),
            })
          )}
        </Panel>
      </div>
      <div className="min-w-0 space-y-5">
        <Panel
          title="Targeted broadcast composer"
          description={
            draft.broadcastStatus === "pending"
              ? "Awaiting independent approval • no messages sent"
              : "No messages sent • content requires independent approval"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {select("Channel", "channel", ["Email + dashboard banner", "Email", "Dashboard banner"])}
            {select("Template", "template", ["Market update · v1.2", "Offering announcement · v1.0"])}
            {field("Audience", "audience", true)}
          </div>
          <div className="space-y-3 text-sm text-muted-foreground [&_span]:mx-2">
            <p>
              Estimated segment <span>·</span> 420 investors
            </p>
            <p>
              Marketing consent <span>·</span> 312 opted in
            </p>
            <p>
              Suppressed / unsubscribed <span>·</span> 108 excluded
            </p>
            <p>
              Eligible recipients <span>·</span> 312
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Subject / banner title", "subject", true)}
            {field("Message body", "body", true, true)}
            {field("CTA label / destination", "cta", true)}
          </div>
          <Notice>
            Required footer: target returns are not guaranteed; capital is at risk. Unsubscribe controls are included
            for marketing email and SMS.
          </Notice>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Schedule", "schedule")}
            {field("Approval owner", "owner")}
          </div>
          <div className="flex flex-wrap gap-2">
            {action("Save draft", () => persist())}
            {action(
              draft.broadcastStatus === "pending" ? "Awaiting approval" : "Request approval",
              () => persist("broadcastStatus"),
              true,
              draft.broadcastStatus === "pending"
            )}
          </div>
          <Button className="w-full" disabled title="Sending requires a connected backend and independent approval">
            Send approved broadcast
          </Button>
        </Panel>
        <Panel title="Audience preview" description="Email template and dashboard banner preview">
          <div className="space-y-3 rounded-xl bg-muted/60 p-5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
            <h3>{draft.subject === GROWTH_DEFAULTS.subject ? "Explore Golden Estate" : draft.subject}</h3>
            <p>
              {draft.body === GROWTH_DEFAULTS.body
                ? "Read the prospectus for this 12-month real-estate offering. Review the assumptions, fees and exit terms before you decide."
                : draft.body}
            </p>
            {action(draft.cta.split("/")[0].trim(), () => preview("Prospectus"), true)}
            <small>{footer}</small>
          </div>
          <div className="flex flex-wrap gap-2">
            {action("Push preview", () => preview("Push"))}
            {action("SMS preview", () => preview("SMS"))}
          </div>
        </Panel>
        <Panel title="Bulk SMS controls">
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            <span>Consent-based audience</span>
            <p>312 opted-in recipients · excludes suppression list</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field(`SMS draft · ${draft.sms.length} / 160 characters`, "sms", true, true)}
          </div>
          <div className="space-y-3 text-sm text-muted-foreground [&_span]:mx-2">
            <p>
              Estimated segments <span>·</span> 312 × 1 SMS
            </p>
            <p>
              Illustrative cost <span>·</span> ₦4 / segment · ₦1,248
            </p>
          </div>
          {action(
            draft.smsStatus === "pending" ? "SMS awaiting approval" : "Preview SMS & request approval",
            () =>
              AppModal.open({
                title: "SMS approval preview",
                description: "312 opted-in recipients · illustrative cost ₦1,248",
                content: (
                  <div className="space-y-3 rounded-xl bg-muted/60 p-5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                    <p>{draft.sms}</p>
                    <small>No messages will be sent. This request is saved only in your browser.</small>
                  </div>
                ),
                primaryButton: { children: "Request approval", onClick: () => persist("smsStatus") },
              }),
            false,
            draft.smsStatus === "pending"
          )}
        </Panel>
      </div>
    </div>
  );
}
