"use client";

import * as React from "react";

import { PROPERTIES, coverImage, fullLocation, naira } from "@/app/dashboard/(dashboard)/marketplace/page";
import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  adminContentStateSchema,
  aiContentFormSchema,
  editorialFormSchema,
  legalTemplateFormSchema,
} from "@/constant/schemas/admin-content";
import { printPreview } from "@/lib/print-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AiBrain01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Download04Icon,
  File01Icon,
  LockIcon,
  News01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceDate, FinanceNumber, FinanceText } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { CONTENT_DEFAULTS, LEGAL_DOCUMENTS, RECOMMENDATION_AUDIT, SIGNED_AUDIT } from "../_operations/workspace-data";
import { FilterChips, SegmentBar, StatusPill, type Tone, formatDate, formatTime } from "../account/page";
import { CheckMark } from "../kyc/page";
import { DetailList } from "../users/page";

type State = z.infer<typeof adminContentStateSchema>;
const WEIGHTS = [
  { name: "locationWeight", label: "Location", color: "bg-foreground" },
  { name: "budgetWeight", label: "Budget", color: "bg-accent" },
  { name: "riskWeight", label: "Risk preference", color: "bg-foreground/40" },
  { name: "tenureWeight", label: "Tenure", color: "bg-accent/45" },
] as const;
const LIBRARY: { content: string; version: string; status: string; tone: Tone }[] = [
  { content: "Lekki market trend", version: "v0.4", status: "Draft", tone: "muted" },
  { content: "Abuja rental outlook", version: "v1.2", status: "Published", tone: "success" },
  { content: "Price projection model note", version: "v0.8", status: "Pending review", tone: "warning" },
];

function ModelCard({ value, save, reviews }: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  const form = useForm({ resolver: zodResolver(aiContentFormSchema), defaultValues: value.model });
  const weights = useWatch({ control: form.control });
  const parts = WEIGHTS.map((w) => ({ ...w, value: Number(weights[w.name]) || 0 }));
  const sum = parts.reduce((total, p) => total + p.value, 0);

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Recommendation model" note="Draft v0.8 · live v0.7 keeps serving until approved">
          <StatusPill tone="muted">Draft v0.8</StatusPill>
        </CardHeader>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((v) =>
          AppModal.open({
            title: "Submit model for review",
            description: "Model parameters v0.8",
            content: <Notice>Live recommendations keep using v0.7 until v0.8 is independently approved.</Notice>,
            primaryButton: {
              children: "Save review request",
              onClick: () => {
                if (
                  reviews.submit({
                    kind: "model-review",
                    subjectId: "model-0.8",
                    summary: "Model parameters v0.8",
                    reason: v.assumptions,
                    details: { ...v, baseVersion: "0.7" },
                  })
                )
                  save({ ...value, model: v });
              },
            },
            secondaryButton: { children: "Cancel" },
          })
        )}
      >
        <Section step={1} title="Signal weights">
          <div className="flex flex-col gap-2.5">
            <SegmentBar
              className="h-2.5 bg-muted"
              parts={parts.map((p) => ({ key: p.name, value: p.value, className: p.color }))}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              {parts.map((p) => (
                <p key={p.name} className="flex items-center gap-1.5">
                  <span aria-hidden className={cn("size-2 rounded-full", p.color)} />
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-semibold tabular-nums">{p.value}%</span>
                </p>
              ))}
              <span
                className={cn(
                  "ml-auto font-semibold tabular-nums",
                  sum === 100 ? "text-muted-foreground" : "text-destructive"
                )}
              >
                {sum}% of 100%
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEIGHTS.map((w) => (
              <FinanceNumber key={w.name} form={form} name={w.name} label={`${w.label} (%)`} />
            ))}
          </div>
        </Section>
        <Section step={2} title="Confidence & disclosure">
          <FinanceNumber form={form} name="confidenceThreshold" label="Minimum confidence (0–1)" />
          <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <span>
              <span className="block font-semibold">Uncertainty disclosure</span>
              <span className="block text-xs text-muted-foreground">Always shown on every recommendation</span>
            </span>
            <Switch aria-label="Uncertainty disclosure" checked disabled />
          </label>
        </Section>
        <Section step={3} title="Assumptions">
          <FinanceText form={form} name="assumptions" label="Projection assumptions" area />
          <p className="text-xs/5 text-muted-foreground">
            Targets are never promised returns. Confidence is a model assessment, not a probability of earning a return.
          </p>
        </Section>
        <div className="flex justify-end border-t border-border bg-muted/40 p-5">
          <Button type="submit" className="h-10 rounded-full px-5" disabled={!reviews.ready}>
            Submit for review
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditorialCard({ value, save, reviews }: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  const form = useForm({ resolver: zodResolver(editorialFormSchema), defaultValues: value.article });
  const [min, max] = useWatch({ control: form.control, name: ["forecastMin", "forecastMax"] });

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Market insight" note="Articles, trends and projections">
        <StatusPill tone="muted">Draft v0.4</StatusPill>
      </CardHeader>
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Illustrative forecast range</p>
        <p className="mt-1 text-3xl font-light tabular-nums">
          {min ?? "–"}% – {max ?? "–"}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Estimates are uncertain and not guaranteed returns.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) =>
          AppModal.open({
            title: "Request editorial approval",
            description: v.title,
            content: <Notice>Reviewed {formatDate(v.reviewDate)}. Nothing is published from this preview.</Notice>,
            primaryButton: {
              children: "Save review request",
              onClick: () => {
                if (
                  reviews.submit({
                    kind: "editorial-review",
                    subjectId: "lekki-article-0.4",
                    summary: v.title,
                    reason: v.summary,
                    details: { ...v },
                  })
                )
                  save({ ...value, article: v });
              },
            },
            secondaryButton: { children: "Cancel" },
          })
        )}
      >
        <FinanceText form={form} name="title" label="Title" />
        <FinanceText form={form} name="source" label="Source & data period" />
        <FinanceText form={form} name="summary" label="Summary" area />
        <div className="grid gap-4 sm:grid-cols-3">
          <FinanceNumber form={form} name="forecastMin" label="Low (%)" />
          <FinanceNumber form={form} name="forecastMax" label="High (%)" />
          <FinanceDate form={form} name="reviewDate" label="Reviewed" />
        </div>
        <div className="flex gap-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-full"
            onClick={form.handleSubmit((v) =>
              AppModal.open({
                title: v.title,
                description: v.source,
                content: (
                  <div className="space-y-4">
                    <p className="text-sm/6">{v.summary}</p>
                    <Notice>
                      Illustrative forecast {v.forecastMin}%–{v.forecastMax}% · reviewed {formatDate(v.reviewDate)}.
                      Estimates are uncertain and not guaranteed returns.
                    </Notice>
                  </div>
                ),
              })
            )}
          >
            Preview
          </Button>
          <Button type="submit" className="h-10 flex-1 rounded-full" disabled={!reviews.ready}>
            Request approval
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LibraryCard() {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Content library" note={`${LIBRARY.length} pieces · separate approval workflow`} />
      <ul className="flex flex-col">
        {LIBRARY.map((item) => (
          <li key={item.content} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon icon={News01Icon} aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.content}</span>
              <span className="block text-xs text-muted-foreground">{item.version}</span>
            </span>
            <StatusPill tone={item.tone}>{item.status}</StatusPill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AiContentWorkspace(props: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <ModelCard {...props} />
      <div className="flex min-w-0 flex-col gap-5">
        <EditorialCard {...props} />
        <LibraryCard />
      </div>
    </div>
  );
}

const ROW =
  "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring";

function ReadOnly() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3" />
      Read only
    </span>
  );
}

function AuditTrail() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Signed contracts" note="Each acceptance stays bound to the version signed">
          <ReadOnly />
        </CardHeader>
        <ul className="flex flex-col">
          {SIGNED_AUDIT.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={ROW}
                onClick={() =>
                  AppModal.open({
                    title: `Contract ${r.id}`,
                    description: r.investorReference,
                    content: (
                      <div className="space-y-4">
                        <DetailList
                          rows={[
                            ["Accepted version", r.acceptedVersion],
                            ["Accepted at", `${formatDate(r.acceptedAt)}, ${formatTime(r.acceptedAt)} UTC`],
                            ["Consent evidence", r.evidenceReference],
                          ]}
                        />
                        <Notice>
                          Illustrative record. Connect the immutable audit service for verified evidence. Publishing a
                          new template can&apos;t rewrite this acceptance.
                        </Notice>
                      </div>
                    ),
                  })
                }
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon icon={File01Icon} aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold tabular-nums">
                    {r.id} · {r.investorReference}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {formatDate(r.acceptedAt)}, {formatTime(r.acceptedAt)} UTC
                  </span>
                </span>
                <StatusPill tone="muted">{r.acceptedVersion}</StatusPill>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Recommendation log" note="Masked investor queries · access is audited">
          <ReadOnly />
        </CardHeader>
        <ul className="flex flex-col">
          {RECOMMENDATION_AUDIT.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={ROW}
                onClick={() =>
                  AppModal.open({
                    title: `Recommendation ${r.id}`,
                    description: r.investorReference,
                    content: (
                      <div className="space-y-4">
                        <DetailList
                          rows={[
                            ["Query", r.query],
                            ["Recommendation", r.recommendation],
                            ["Context", r.context],
                            ["Model version", `v${r.modelVersion}`],
                          ]}
                        />
                        <Notice>This view doesn&apos;t rerun the model or change a historical recommendation.</Notice>
                      </div>
                    ),
                  })
                }
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <HugeiconsIcon icon={AiBrain01Icon} aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">&ldquo;{r.query}&rdquo;</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.recommendation} · {r.investorReference}
                  </span>
                </span>
                <StatusPill tone="muted">v{r.modelVersion}</StatusPill>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const TOKENS = ["{{legal_name}}", "{{units}}", "{{principal}}"];

function DocumentsCard() {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Legal documents" note="Published versions stay live until a new one is approved" />
      <ul className="flex flex-col">
        {LEGAL_DOCUMENTS.map((doc) => {
          const pending = doc.review.includes("pending");
          return (
            <li key={doc.document} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={File01Icon} aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{doc.document}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Live {doc.published}
                  {doc.draft !== "—" && ` · draft ${doc.draft}`}
                </span>
              </span>
              <StatusPill tone={pending ? "warning" : "success"}>{doc.review}</StatusPill>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function TemplateEditor({ value, save, reviews }: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  const form = useForm({ resolver: zodResolver(legalTemplateFormSchema), defaultValues: value.legal });
  const body = useWatch({ control: form.control, name: "body" }) ?? "";

  const requestReview = form.handleSubmit((v) => {
    if (v.version === "1.3") {
      form.setError("version", { message: "Use a new version; published GE v1.3 can't be overwritten" });
      return;
    }
    AppModal.open({
      title: "Submit for legal review",
      description: `${v.title} · v${v.version}`,
      content: (
        <Notice>
          Legal and compliance approval is required. No signed contract or published template is replaced.
        </Notice>
      ),
      primaryButton: {
        children: "Save review request",
        onClick: () => {
          if (
            reviews.submit({
              kind: "legal-review",
              subjectId: `GE-${v.version}`,
              summary: `Legal template v${v.version}`,
              reason: v.reason,
              details: { ...v, baseVersion: "1.3" },
            })
          )
            save({ ...value, legal: v });
        },
      },
      secondaryButton: { children: "Cancel" },
    });
  });

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="border-b border-border p-5">
        <CardHeader title="Agreement template" note="Golden Estate · editing draft against live v1.3">
          <StatusPill tone="muted">Draft</StatusPill>
        </CardHeader>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((v) => {
          if (save({ ...value, legal: v })) toast.success("Draft saved locally · the published version is unchanged");
        })}
      >
        <Section step={1} title="Version">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <FinanceText form={form} name="title" label="Template title" />
            <FinanceText form={form} name="version" label="Draft version" />
          </div>
        </Section>
        <Section step={2} title="Agreement body">
          <FinanceText form={form} name="body" label="Body" area />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-xs text-muted-foreground">Required fields</span>
            {TOKENS.map((token) => (
              <CheckMark key={token} ok={body.includes(token)} label={token} />
            ))}
          </div>
        </Section>
        <Section step={3} title="Reason for change">
          <FinanceText form={form} name="reason" label="Change reason" area />
          <p className="text-xs/5 text-muted-foreground">
            Signed agreements stay bound to the version the investor accepted.
          </p>
        </Section>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
          <Button type="button" variant="ghost" className="h-10 rounded-full px-4" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Publish
          </Button>
          <Button type="submit" variant="outline" className="h-10 rounded-full px-4">
            Save draft
          </Button>
          <Button type="button" className="h-10 rounded-full px-5" disabled={!reviews.ready} onClick={requestReview}>
            Submit for review
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ProspectusCard({ value, save }: { value: State; save: (v: State) => boolean }) {
  const [property, setProperty] = React.useState(value.prospectusProperty);
  const investment = PROPERTIES.find((i) => i.id === property) ?? PROPERTIES[0];
  const lines = [
    `DRAFT · ${investment.name} · approved source v1.3`,
    `Location: ${fullLocation(investment)}`,
    `Unit price: ${naira(investment.unitPrice)} · ${investment.totalUnits} units`,
    `Target: ${investment.targetRoi}% simple annual · ${investment.tenureMonths} months`,
    "Capital is at risk. Target returns and exit are not guaranteed. Review title, liquidity and development risks before investing.",
  ];

  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Prospectus generator" note="Residential offering template v2.1" />
      <SelectField
        id="legal-property"
        label="Property"
        labelClassName="sr-only"
        value={property}
        onChange={setProperty}
        triggerClassName="h-10! w-full rounded-full bg-card px-3.5"
        items={PROPERTIES.map((i) => ({ value: i.id, label: i.name }))}
      />
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/8">
        <Image src={coverImage(investment)} width={384} height={160} alt="" className="h-32 w-full object-cover" />
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-semibold">{investment.name}</p>
            <p className="text-xs text-muted-foreground">{fullLocation(investment)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {[
              ["Unit price", naira(investment.unitPrice)],
              ["Units", investment.totalUnits.toLocaleString()],
              ["Target / year", `${investment.targetRoi}%`],
              ["Tenure", `${investment.tenureMonths} months`],
            ].map(([label, v]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="h-10 flex-1 rounded-full"
          onClick={() => {
            if (save({ ...value, prospectusProperty: property }))
              AppModal.open({
                title: "Draft prospectus",
                description: "Generated from illustrative approved offering data",
                content: (
                  <div className="space-y-3">
                    {lines.map((line) => (
                      <p key={line} className="text-sm/6">
                        {line}
                      </p>
                    ))}
                  </div>
                ),
                secondaryButton: { children: "Close" },
              });
          }}
        >
          Generate draft
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4"
          onClick={() => printPreview(`${investment.name} · draft prospectus`, lines)}
        >
          <HugeiconsIcon icon={Download04Icon} aria-hidden />
          PDF
        </Button>
      </div>
      <p className="text-xs/5 text-muted-foreground">Every draft carries the capital-at-risk disclosure.</p>
    </Card>
  );
}

function LegalWorkspace(props: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <DocumentsCard />
        <TemplateEditor {...props} />
      </div>
      <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-24">
        <ProspectusCard value={props.value} save={props.save} />
      </div>
    </div>
  );
}

type View = "legal" | "ai" | "audit";
const REQUEST_KINDS = ["legal-review", "model-review", "editorial-review"];
const LEGAL_PENDING = LEGAL_DOCUMENTS.filter((d) => d.review.includes("pending")).length;
const CONTENT_PENDING = LIBRARY.filter((i) => i.tone === "warning").length;
const LIVE =
  LEGAL_DOCUMENTS.filter((d) => !d.review.includes("pending")).length +
  LIBRARY.filter((i) => i.tone === "success").length;

function GovernanceCard() {
  const groups = [
    { key: "legal", label: "Legal in review", value: LEGAL_PENDING, color: "bg-accent" },
    { key: "content", label: "Market & AI in review", value: CONTENT_PENDING, color: "bg-white/40" },
    { key: "live", label: "Live & current", value: LIVE, color: "bg-white/15" },
  ];
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Awaiting approval</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{LEGAL_PENDING + CONTENT_PENDING}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">Live model v0.7</span>
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
          { label: "Signed contracts", value: SIGNED_AUDIT.length, note: "version-locked" },
          { label: "Recommendations", value: RECOMMENDATION_AUDIT.length, note: "in the audit log" },
          { label: "Legal documents", value: LEGAL_DOCUMENTS.length, note: "under version control" },
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

function RequestsCard({ reviews }: { reviews: Reviews }) {
  const open = reviews.requests.filter((r) => REQUEST_KINDS.includes(r.kind));
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Your review requests" note="Saved in this browser · nothing is published" />
      {open.length ? (
        <ul className="flex flex-col">
          {open.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{r.summary}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.subjectId} · {formatDate(r.createdAt)}
                </span>
              </span>
              <StatusPill tone="warning">Pending</StatusPill>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-5" />
          </span>
          <p className="text-sm font-semibold">Nothing submitted yet</p>
          <p className="max-w-60 text-xs text-muted-foreground">
            Drafts you send for legal, model or editorial review show up here.
          </p>
        </div>
      )}
    </Card>
  );
}

export default function ContentPage() {
  const store = usePreviewState("citycore-admin-content-v1", adminContentStateSchema, CONTENT_DEFAULTS);
  const reviews = useReviewRequests();
  const [view, setView] = React.useState<View>("legal");

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Helpdesk & audit</h1>
        <p className="text-sm text-muted-foreground">
          Legal documents, market & AI content and read-only audit trails · drafts never change what&apos;s live
        </p>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <GovernanceCard />
        <RequestsCard reviews={reviews} />
      </div>

      <FilterChips
        label="Workspace"
        value={view}
        onChange={setView}
        options={[
          { value: "legal", label: "Legal documents", count: LEGAL_PENDING },
          { value: "ai", label: "Market & AI", count: CONTENT_PENDING },
          { value: "audit", label: "Audit trail" },
        ]}
      />

      {!store.ready ? (
        <Skeleton className="h-[32rem] rounded-2xl" />
      ) : (
        <>
          <div hidden={view !== "legal"}>
            <LegalWorkspace value={store.value} save={store.save} reviews={reviews} />
          </div>
          <div hidden={view !== "ai"}>
            <AiContentWorkspace value={store.value} save={store.save} reviews={reviews} />
          </div>
          <div hidden={view !== "audit"}>
            <AuditTrail />
          </div>
        </>
      )}
    </>
  );
}

export type Reviews = ReturnType<typeof useReviewRequests>;

export function CardHeader({ title, note, children }: { title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </div>
  );
}

export function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border p-5 first:border-none">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
