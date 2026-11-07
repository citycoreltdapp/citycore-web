"use client";
import * as React from "react";

import { INVESTMENTS, naira } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { adminContentStateSchema, legalTemplateFormSchema } from "@/constant/schemas/admin-content";
import { printPreview } from "@/lib/print-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../_operations/requests";
import { FinanceText } from "../_operations/treasury-ui";
import { Notice, Panel } from "../_operations/ui";
import { LEGAL_DOCUMENTS, SIGNED_AUDIT } from "../_operations/workspace-data";

type State = z.infer<typeof adminContentStateSchema>;
export function LegalWorkspace({ value, save }: { value: State; save: (v: State) => boolean }) {
  const { submit, ready } = useReviewRequests();
  const form = useForm({ resolver: zodResolver(legalTemplateFormSchema), defaultValues: value.legal });
  const [property, setProperty] = React.useState(value.prospectusProperty);
  const investment = INVESTMENTS.find((i) => i.id === property) ?? INVESTMENTS[0];
  const prospectus = [
    `DRAFT · ${investment.name} · approved source v1.3`,
    `Location: ${investment.location}`,
    `Unit price: ${naira(investment.unitPrice)} · ${investment.totalUnits} units`,
    `Target: ${investment.annualRoi}% simple annual · ${investment.tenure} months`,
    `Capital is at risk. Target returns and exit are not guaranteed. Review title, liquidity and development risks before investing.`,
  ];
  return (
    <div className="space-y-5">
      <Panel
        title="Legal documents & prospectus generator"
        description="Legal workspace · current published documents remain active"
      >
        <SelectField
          id="legal-property"
          label="Property data source"
          value={property}
          onChange={setProperty}
          items={INVESTMENTS.map((i) => ({ value: i.id, label: `${i.name} · approved v1.3` }))}
        />
        <SelectField
          id="legal-prospectus-template"
          label="Prospectus template"
          value="residential-2.1"
          onChange={() => {}}
          items={[{ value: "residential-2.1", label: "Residential offering v2.1" }]}
        />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt>Unit price / allocation</dt>
          <dd>
            {naira(investment.unitPrice)} / {investment.totalUnits} units
          </dd>
          <dt>Target / tenure</dt>
          <dd>
            {investment.annualRoi}% simple annual / {investment.tenure} months
          </dd>
          <dt>Disclosure block</dt>
          <dd>Capital at risk · no guaranteed exit</dd>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (save({ ...value, prospectusProperty: property }))
                AppModal.open({
                  title: "Draft prospectus",
                  description: "Generated from illustrative approved offering data",
                  content: (
                    <div className="space-y-4">
                      {prospectus.map((line) => (
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
            Generate draft prospectus
          </Button>
          <Button variant="outline" onClick={() => printPreview(`${investment.name} · draft prospectus`, prospectus)}>
            Preview / Save PDF
          </Button>
        </div>
        <DataTable
          data={LEGAL_DOCUMENTS}
          showPagination={false}
          columns={[
            { accessorKey: "document", header: "Document" },
            { accessorKey: "published", header: "Published" },
            { accessorKey: "draft", header: "Draft" },
            { accessorKey: "review", header: "Review" },
          ]}
        />
      </Panel>
      <Panel title="Agreement template editor" description="GE v1.4 draft · placeholder fields are visibly bound">
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => {
            if (save({ ...value, legal: v })) toast.success("Legal draft saved locally; published version unchanged");
          })}
        >
          <FinanceText form={form} name="title" label="Template title" />
          <FinanceText form={form} name="version" label="Draft version" />
          <FinanceText form={form} name="body" label="Agreement body" area />
          <FinanceText form={form} name="reason" label="Change reason" area />
          <Notice>
            Required bindings: {"{{legal_name}}"}, {"{{units}}"}, {"{{principal}}"}. Signed agreements remain bound to
            the version accepted at consent time.
          </Notice>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline">
              Save legal draft
            </Button>
            <Button
              type="button"
              disabled={!ready}
              onClick={form.handleSubmit((v) => {
                if (v.version === "1.3") {
                  form.setError("version", { message: "Use a new version; published GE v1.3 cannot be overwritten" });
                  return;
                }
                AppModal.open({
                  title: "Submit legal review",
                  content: (
                    <Notice>
                      {v.title} · v{v.version}. Legal and compliance approval is required. No signed contract or
                      published template will be replaced.
                    </Notice>
                  ),
                  primaryButton: {
                    children: "Save legal review request",
                    onClick: () => {
                      if (
                        submit({
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
              })}
            >
              Submit legal review
            </Button>
            <Button disabled>Publish approved version</Button>
          </div>
        </form>
      </Panel>
      <Panel title="Signed-contract audit · read only">
        <DataTable
          showPagination={false}
          data={SIGNED_AUDIT}
          columns={[
            { accessorKey: "investorReference", header: "Investor / contract" },
            { accessorKey: "acceptedVersion", header: "Version" },
            {
              accessorKey: "acceptedAt",
              header: "Accepted at",
              cell: ({ row }) => row.original.acceptedAt.replace("T", " ").replace("Z", " UTC"),
            },
            {
              id: "evidence",
              header: "Evidence",
              cell: ({ row }) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    AppModal.open({
                      title: `Audit record · ${row.original.id}`,
                      content: (
                        <div className="space-y-4">
                          <p className="text-sm">Consent evidence: {row.original.evidenceReference}</p>
                          <p className="text-sm">
                            Accepted {row.original.acceptedVersion} · {row.original.acceptedAt}
                          </p>
                          <Notice>
                            Read-only illustrative record. Connect the immutable audit service for verified evidence.
                            Publishing a new template cannot rewrite this acceptance.
                          </Notice>
                        </div>
                      ),
                    })
                  }
                >
                  View audit record
                </Button>
              ),
            },
          ]}
        />
        <Notice>Original agreement, consent timestamp and evidence remain bound to the accepted version.</Notice>
      </Panel>
    </div>
  );
}
