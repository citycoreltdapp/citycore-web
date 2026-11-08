"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type KycCase,
  type KycDecisionForm,
  kycDecisionFormSchema,
  kycOverrideFormSchema,
  kycOverrideRequestSchema,
} from "@/constant/schemas/admin-people";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaceIdIcon, Home01Icon, IdentityCardIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CURRENT_REVIEWER, INVESTORS, KYC_CASES, STAFF } from "../../_operations/data";
import { useReviewRequests } from "../../_operations/requests";
import { Notice } from "../../_operations/ui";
import { AS_OF } from "../../account/_data";
import { FilterChips, StatusPill, type Tone, formatDate, toneDot } from "../../account/page";
import { BackLink, Initials, KYC_LABELS, KYC_TONES, investorName } from "../../users/page";
import { CheckMark, FACE_MATCH_THRESHOLD, ageLabel } from "../page";

type Queue = "pending" | "actionRequired";
const investorOf = (record: KycCase) => INVESTORS.find((i) => i.id === record.investorId)!;
const REVIEWERS = STAFF.filter((s) => s.role === "compliance" || s.role === "super-admin");
const SUPER_ADMINS = STAFF.filter((s) => s.role === "super-admin");

const EVIDENCE = {
  passport: { title: "Government ID", subtitle: "Passport", icon: IdentityCardIcon, action: "document" },
  address: { title: "Proof of address", subtitle: "Utility bill", icon: Home01Icon, action: "document" },
  liveness: { title: "Liveness", subtitle: "Selfie capture", icon: FaceIdIcon, action: "capture" },
} as const;

function inspect(kind: keyof typeof EVIDENCE, record: KycCase) {
  const { title, action } = EVIDENCE[kind];
  AppModal.open({
    title,
    description: `${investorName(investorOf(record))} · ${record.id}`,
    content: (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
          <HugeiconsIcon icon={EVIDENCE[kind].icon} aria-hidden className="size-8 text-muted-foreground" />
          <p className="font-semibold">Masked evidence placeholder</p>
          <p className="text-sm text-muted-foreground">
            No original {action === "capture" ? "video capture" : "identity document"} is stored in this preview.
          </p>
        </div>
        <Notice>
          Connect the restricted evidence service for an authorized, short-lived view. Every access must be recorded on
          the server. Full identity numbers are never shown here.
        </Notice>
      </div>
    ),
  });
}

function EvidenceCard({ kind, record }: { kind: keyof typeof EVIDENCE; record: KycCase }) {
  const { title, subtitle, icon, action } = EVIDENCE[kind];
  const investor = investorOf(record);
  const expired = record.idExpiry < AS_OF;
  const facts: [string, string][] =
    kind === "passport"
      ? [
          ["Name", investorName(investor)],
          ["Number", `A••••••${record.idLast4}`],
          ["Expires", formatDate(record.idExpiry)],
        ]
      : kind === "address"
        ? [
            ["Issued", formatDate(record.addressIssuedAt)],
            ["Address", "Lekki, Lagos"],
            ["Match", "Address on file"],
          ]
        : [
            ["Face match", `${record.faceMatch}%`],
            ["Prompts", "Blink, head turn"],
            ["Source", "Model output"],
          ];
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0 ring-foreground/8">
      <button
        type="button"
        onClick={() => inspect(kind, record)}
        className="group relative flex h-28 items-center justify-center bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span aria-hidden className="absolute inset-x-6 top-5 flex flex-col gap-1.5 opacity-60">
          <span className="h-1.5 w-1/3 rounded-full bg-foreground/15" />
          <span className="h-1.5 w-2/3 rounded-full bg-foreground/10" />
          <span className="h-1.5 w-1/2 rounded-full bg-foreground/10" />
        </span>
        <span className="relative flex size-11 items-center justify-center rounded-full bg-card shadow-sm transition-transform group-hover:scale-105">
          <HugeiconsIcon icon={icon} aria-hidden className="size-5" />
        </span>
        <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <HugeiconsIcon icon={ViewIcon} aria-hidden className="size-3.5" />
          Inspect {action}
        </span>
      </button>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {kind === "passport" && expired && <StatusPill tone="danger">Expired</StatusPill>}
          {kind === "liveness" && record.faceMatch < FACE_MATCH_THRESHOLD && (
            <StatusPill tone="warning">Low match</StatusPill>
          )}
        </div>
        <dl className="flex flex-col gap-1 text-xs">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

const DECISIONS: { value: KycDecisionForm["decision"]; label: (tier: number) => string; tone: Tone }[] = [
  { value: "approve", label: (tier) => `Approve Tier ${tier}`, tone: "success" },
  { value: "request-information", label: () => "Request info", tone: "warning" },
  { value: "reject", label: () => "Reject", tone: "danger" },
];

function OverrideForm({
  record,
  ready,
  submit,
}: { record: KycCase } & Pick<ReturnType<typeof useReviewRequests>, "ready" | "submit">) {
  const override = useForm<z.infer<typeof kycOverrideFormSchema>>({
    resolver: zodResolver(kycOverrideFormSchema),
    defaultValues: { reason: "", approverId: SUPER_ADMINS[0]?.id ?? "" },
  });
  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={override.handleSubmit((values) => {
        const parsed = kycOverrideRequestSchema.safeParse({
          ...values,
          caseId: record.id,
          requestedBy: CURRENT_REVIEWER,
          idempotencyKey: crypto.randomUUID(),
        });
        if (!parsed.success) {
          override.setError("approverId", { message: parsed.error.issues[0].message });
          return;
        }
        AppModal.open({
          title: "Request manual override",
          content: (
            <div className="space-y-4">
              <p className="text-sm/6 text-muted-foreground">{values.reason}</p>
              <Notice>
                Second approver: {STAFF.find((s) => s.id === values.approverId)?.name}. This only saves a local review
                request.
              </Notice>
            </div>
          ),
          primaryButton: {
            children: "Request override review",
            onClick: () =>
              submit({
                kind: "kyc-override",
                subjectId: record.id,
                summary: "Manual override review",
                reason: values.reason,
                details: { ...values },
              }),
          },
          secondaryButton: { children: "Cancel" },
        });
      })}
    >
      <Notice>
        Restricted to the Compliance Lead with a second Super Admin. Failed checks are never bypassed silently, and the
        server must confirm the role.
      </Notice>
      <Controller
        control={override.control}
        name="reason"
        render={({ field, fieldState }) => (
          <TextAreaField
            {...field}
            id="override-reason"
            label="Override reason"
            placeholder="The evidence that explains the failed check"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={override.control}
        name="approverId"
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id="override-approver"
            label="Second approver"
            error={fieldState.error?.message}
            items={SUPER_ADMINS.map((s) => ({ value: s.id, label: s.name }))}
          />
        )}
      />
      <Button variant="outline" type="submit" className="rounded-full" disabled={!ready}>
        Request override review
      </Button>
    </form>
  );
}

function DecisionCard({ record }: { record: KycCase }) {
  const { submit, ready, requests } = useReviewRequests();
  const [showOverride, setShowOverride] = React.useState(false);
  const form = useForm<KycDecisionForm>({
    resolver: zodResolver(kycDecisionFormSchema),
    defaultValues: { decision: "approve", reason: "", message: "" },
  });
  const decision = useWatch({ control: form.control, name: "decision" });
  const caseRequests = requests.filter((r) => r.subjectId === record.id);
  const pending = caseRequests.some((r) => r.kind === "kyc-decision");
  const eligible = record.status === "pending" || record.status === "actionRequired";
  const matches = record.bvnMatch && record.ninMatch;

  function review(values: KycDecisionForm) {
    if (values.decision === "approve" && !matches) {
      form.setError("decision", { message: "A failed check needs an override review before approval" });
      return;
    }
    AppModal.open({
      title: `Review ${values.decision.replaceAll("-", " ")} decision`,
      description: `${record.id} · no decision has been applied`,
      content: (
        <div className="space-y-4">
          <p className="text-sm/6">{values.reason}</p>
          {values.message && (
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Message to applicant</p>
              <p className="mt-1 text-sm/6">{values.message}</p>
            </div>
          )}
          <Notice>
            This saves a local review request. The investor&apos;s verification status doesn&apos;t change and no
            message is sent.
          </Notice>
        </div>
      ),
      primaryButton: {
        children: "Save decision request",
        onClick: () =>
          submit({
            kind: "kyc-decision",
            subjectId: record.id,
            summary: `${values.decision} · Tier ${record.tier}`,
            reason: values.reason,
            details: { ...values },
          }),
      },
      secondaryButton: { children: "Cancel" },
    });
  }

  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-base font-semibold">Decision</h2>
          <p className="text-xs text-muted-foreground">Record your assessment. A second reviewer confirms it.</p>
        </div>
        {caseRequests.map((r) => (
          <StatusPill key={r.id} tone="warning">
            {r.kind === "kyc-override" ? "Override pending" : "Decision pending"}
          </StatusPill>
        ))}
      </div>

      {!eligible ? (
        <p className="p-5 text-sm text-muted-foreground">
          This case is already <span className="font-semibold text-foreground">{record.status}</span>. New decisions are
          unavailable.
        </p>
      ) : (
        <form className="flex flex-col gap-5 p-5" onSubmit={form.handleSubmit(review)} noValidate>
          <Controller
            control={form.control}
            name="decision"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <div role="radiogroup" aria-label="Decision" className="grid grid-cols-3 gap-2">
                  {DECISIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={field.value === option.value}
                      onClick={() => {
                        field.onChange(option.value);
                        form.clearErrors("decision");
                      }}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border border-border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        field.value === option.value ? "border-foreground/30 bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <span aria-hidden className={cn("size-2 rounded-full", toneDot(option.tone))} />
                      <span className="font-semibold">{option.label(record.tier)}</span>
                    </button>
                  ))}
                </div>
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <TextAreaField
                  {...field}
                  id="decision-reason"
                  label="Recorded reason"
                  placeholder="The evidence you reviewed and why"
                  textareaClassName="min-h-28"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="message"
              render={({ field, fieldState }) => (
                <TextAreaField
                  {...field}
                  id="applicant-message"
                  label="Message to applicant"
                  placeholder={decision === "approve" ? "Optional" : "Which evidence they need to provide"}
                  textareaClassName="min-h-28"
                  helpText={decision === "approve" ? "Optional for approvals." : "Required, at least 15 characters."}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="reviewed"
            render={({ field, fieldState }) => (
              <div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={field.value === true} onCheckedChange={field.onChange} />I reviewed the identity,
                  address and liveness evidence.
                </label>
                {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              aria-expanded={showOverride}
              onClick={() => setShowOverride((v) => !v)}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {showOverride ? "Hide manual override" : "Request a manual override"}
            </button>
            <Button type="submit" className="h-10 rounded-full px-5" disabled={!ready || pending}>
              Review decision
            </Button>
          </div>
        </form>
      )}

      {eligible && showOverride && (
        <div className="border-t border-border bg-muted/30 p-5">
          <OverrideForm key={record.id} record={record} ready={ready} submit={submit} />
        </div>
      )}
    </Card>
  );
}

export default function KycReview() {
  const query = useSearchParams();
  const requested = query.get("investor");
  const initial = KYC_CASES.find((c) => c.investorId === requested);
  const [selectedId, setSelectedId] = React.useState(initial?.id ?? KYC_CASES[0].id);
  const [search, setSearch] = React.useState("");
  const [queue, setQueue] = React.useState<Queue>(initial?.status === "actionRequired" ? "actionRequired" : "pending");
  const [reviewer, setReviewer] = React.useState(CURRENT_REVIEWER);
  const selected = KYC_CASES.find((c) => c.id === selectedId)!;
  const investor = investorOf(selected);

  const term = search.trim().toLowerCase();
  const cases = KYC_CASES.filter((c) => c.status === queue)
    .filter((c) => !term || `${c.id} ${investorName(investorOf(c))}`.toLowerCase().includes(term))
    .toSorted((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const select = (record: KycCase) => {
    setSelectedId(record.id);
    window.history.replaceState(null, "", `?investor=${encodeURIComponent(record.investorId)}`);
  };

  if (requested && !initial)
    return (
      <>
        <BackLink href="/admin/kyc">KYC compliance</BackLink>
        <Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center ring-foreground/8">
          <h1 className="text-lg font-semibold">No KYC case for this investor</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            They may already be verified on file. Pick an applicant from the queue to continue.
          </p>
          <Button className="mt-2 rounded-full" nativeButton={false} render={<Link href="/admin/kyc/review" />}>
            Open the queue
          </Button>
        </Card>
      </>
    );

  const checks = [
    { label: "BVN", ok: selected.bvnMatch, detail: `•••••••${selected.bvnLast4}` },
    { label: "NIN", ok: selected.ninMatch, detail: `•••••••${selected.ninLast4}` },
    {
      label: "Face match",
      ok: selected.faceMatch >= FACE_MATCH_THRESHOLD,
      detail: `${selected.faceMatch}% · needs ${FACE_MATCH_THRESHOLD}%`,
    },
    { label: "ID validity", ok: selected.idExpiry >= AS_OF, detail: `Expires ${formatDate(selected.idExpiry)}` },
  ];
  const failed = checks.filter((c) => !c.ok).length;

  return (
    <>
      <BackLink href="/admin/kyc">KYC compliance</BackLink>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
          <p className="text-sm text-muted-foreground">Oldest first · evidence is masked and every view is recorded</p>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4"
          nativeButton={false}
          render={<Link href={`/admin/users/management?investor=${encodeURIComponent(investor.id)}`} />}
        >
          Investor profile
        </Button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <Card className="min-w-0 gap-3 rounded-2xl px-3 py-3 ring-foreground/8 xl:sticky xl:top-24">
          <SearchField
            id="case-search"
            value={search}
            onChange={setSearch}
            placeholder="Name or case reference"
            groupClassName="h-9 bg-card dark:bg-card"
          />
          <FilterChips
            label="Queue"
            value={queue}
            onChange={setQueue}
            options={(["pending", "actionRequired"] as const).map((value) => ({
              value,
              label: KYC_LABELS[value],
              count: KYC_CASES.filter((c) => c.status === value).length,
            }))}
          />
          <ul aria-label="Applications" className="-mx-1 flex max-h-[28rem] flex-col gap-0.5 overflow-y-auto px-1">
            {cases.map((record) => {
              const person = investorOf(record);
              const isActive = record.id === selected.id;
              const flagged = !record.bvnMatch || !record.ninMatch;
              return (
                <li key={record.id}>
                  <button
                    type="button"
                    aria-current={isActive}
                    onClick={() => select(record)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <Initials name={investorName(person)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{investorName(person)}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {record.id} · Tier {record.tier}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] text-muted-foreground">{ageLabel(record.submittedAt)}</span>
                      {flagged && <span className="text-[11px] font-semibold text-destructive">Mismatch</span>}
                    </span>
                  </button>
                </li>
              );
            })}
            {!cases.length && (
              <li className="px-2.5 py-6 text-center text-sm text-muted-foreground">No applications here.</li>
            )}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
            <div className="flex flex-wrap items-start gap-4">
              <Initials name={investorName(investor)} size="lg" className="size-14" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold tracking-tight">{investorName(investor)}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selected.id} · submitted {formatDate(selected.submittedAt)} (
                  {ageLabel(selected.submittedAt).toLowerCase()})
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <StatusPill tone={KYC_TONES[selected.status]}>{KYC_LABELS[selected.status]}</StatusPill>
                  <StatusPill tone="muted">Tier {selected.tier}</StatusPill>
                  <StatusPill tone={failed ? "danger" : "success"}>
                    {failed ? `${failed} check${failed > 1 ? "s" : ""} failed` : "All checks passed"}
                  </StatusPill>
                </div>
              </div>
              <SelectField
                id="assigned-reviewer"
                label="Assigned to"
                value={reviewer}
                onChange={(value) => {
                  setReviewer(value);
                  toast.info("Assignment preview only. It isn't saved or recorded on the server.");
                }}
                className="w-full sm:w-44"
                triggerClassName="h-9! rounded-full bg-card px-3.5"
                items={REVIEWERS.map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
              {[
                ["Legal name", investorName(investor)],
                ["Date of birth", `•• / •• / ${selected.birthYear}`],
                ["BVN", `•••••••${selected.bvnLast4}`],
                ["NIN", `•••••••${selected.ninLast4}`],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 truncate font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Automated checks</h2>
              <span className="text-xs text-muted-foreground">Support the review. They don&apos;t replace it.</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl p-3",
                    check.ok ? "bg-muted/60" : "bg-destructive/8 ring-1 ring-destructive/20"
                  )}
                >
                  <CheckMark ok={check.ok} label={check.ok ? "Passed" : "Failed"} />
                  <p className="text-sm font-semibold">{check.label}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{check.detail}</p>
                </li>
              ))}
            </ul>
            <p className="rounded-xl border border-border p-3 text-sm/6">
              <span className="text-muted-foreground">Reviewer note · </span>
              {selected.note}
            </p>
          </Card>

          <div className="grid gap-5 md:grid-cols-3">
            {(Object.keys(EVIDENCE) as (keyof typeof EVIDENCE)[]).map((kind) => (
              <EvidenceCard key={kind} kind={kind} record={selected} />
            ))}
          </div>

          <DecisionCard key={selected.id} record={selected} />
        </div>
      </div>
    </>
  );
}
