"use client";
import * as React from "react";

import { INVESTMENTS, naira } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminContentStateSchema, legalTemplateFormSchema } from "@/constant/schemas/admin-content";
import { printPreview } from "@/lib/print-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download04Icon, File01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceText } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { LEGAL_DOCUMENTS } from "../_operations/workspace-data";
import { StatusPill } from "../account/_ui";
import { CheckMark } from "../kyc/_ui";
import { CardHeader, type Reviews, Section } from "./_ui";

type State = z.infer<typeof adminContentStateSchema>;
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
  const investment = INVESTMENTS.find((i) => i.id === property) ?? INVESTMENTS[0];
  const lines = [
    `DRAFT · ${investment.name} · approved source v1.3`,
    `Location: ${investment.location}`,
    `Unit price: ${naira(investment.unitPrice)} · ${investment.totalUnits} units`,
    `Target: ${investment.annualRoi}% simple annual · ${investment.tenure} months`,
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
        items={INVESTMENTS.map((i) => ({ value: i.id, label: i.name }))}
      />
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/8">
        <Image
          src={`/assets/images/marketplace/${investment.image}.png`}
          width={384}
          height={160}
          alt=""
          className="h-32 w-full object-cover"
        />
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-semibold">{investment.name}</p>
            <p className="text-xs text-muted-foreground">{investment.location}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {[
              ["Unit price", naira(investment.unitPrice)],
              ["Units", investment.totalUnits.toLocaleString()],
              ["Target / year", `${investment.annualRoi}%`],
              ["Tenure", `${investment.tenure} months`],
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

export function LegalWorkspace(props: { value: State; save: (v: State) => boolean; reviews: Reviews }) {
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
