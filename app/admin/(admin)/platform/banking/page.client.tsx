"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { PasswordField } from "@/components/primitives/password-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type BankingConfigForm,
  bankingConfigFormSchema,
  ledgerMappingSchema,
  postingPreviewFormSchema,
} from "@/constant/schemas/admin-treasury";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../../_operations/requests";
import { BANKING_RETRIES, LEDGER_MAPPINGS } from "../../_operations/treasury-data";
import { FinanceNumber, FinanceSelect, FinanceText, money, reviewBatch } from "../../_operations/treasury-ui";
import { Notice, PageLink, PageTitle, Panel, StatusBadge } from "../../_operations/ui";

export function BankingPage() {
  const { submit, ready, requests } = useReviewRequests();
  const form = useForm<BankingConfigForm>({
    resolver: zodResolver(bankingConfigFormSchema),
    defaultValues: {
      environment: "sandbox",
      endpoint: "https://sandbox.example.invalid/symplus",
      clientId: "",
      tenant: "",
      timeoutSeconds: 30,
      reason: "Initial sandbox setup for integration review",
    },
  });
  const posting = useForm<z.infer<typeof postingPreviewFormSchema>>({
    resolver: zodResolver(postingPreviewFormSchema),
    defaultValues: { reference: "CC-1022", amount: 250000 },
  });
  const [validated, setValidated] = React.useState<z.infer<typeof postingPreviewFormSchema> | null>(null);
  const [selected, setSelected] = React.useState(BANKING_RETRIES[0]);
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    const draft = requests.find((r) => r.kind === "banking-config");
    if (!draft) return;
    const parsed = bankingConfigFormSchema.safeParse(draft.details);
    if (parsed.success) form.reset(parsed.data);
  }, [ready, requests, form]);
  return (
    <>
      <PageTitle
        title="Symplus Core Banking"
        description="Integration configuration and ledger-mapping previews · no live banking connection."
      >
        <PageLink href="/withdrawals">Treasury & withdrawals</PageLink>
      </PageTitle>
      <Notice>
        Sandbox / unconfigured. Credentials have not been entered and no endpoint has been contacted. All customer
        links, balances and retry records below are illustrative previews.
      </Notice>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Panel title="Connection configuration" description="Restricted to authorized integration administrators">
            <StatusBadge value="unconfigured-sandbox" />
            <form
              noValidate
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                submit(
                  {
                    kind: "banking-config",
                    subjectId: "symplus-sandbox",
                    summary: "Symplus sandbox configuration draft",
                    reason: values.reason,
                    details: { ...values },
                  },
                  { replaceDraft: true }
                );
              })}
            >
              <FinanceSelect
                form={form}
                name="environment"
                label="Environment"
                items={[{ value: "sandbox", label: "Sandbox" }]}
              />
              <FinanceText form={form} name="endpoint" label="Base endpoint" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FinanceText form={form} name="clientId" label="Client identifier (non-secret)" />
                <PasswordField
                  id="symplus-secret"
                  label="API secret"
                  value=""
                  onChange={() => {}}
                  disabled
                  placeholder="Configure in server secret store"
                  helpText="Credentials are never stored in browser drafts."
                />
                <FinanceText form={form} name="tenant" label="Tenant / branch" />
                <FinanceNumber form={form} name="timeoutSeconds" label="Timeout (seconds)" />
              </div>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>
                  Enable scheduled sync
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Unavailable until configuration is approved
                  </span>
                </span>
                <Switch aria-label="Enable scheduled sync" checked={false} disabled />
              </label>
              <FinanceText form={form} name="reason" label="Change reason" area />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="outline" disabled={!ready}>
                  Save configuration draft
                </Button>
                <Button disabled>Test sandbox connection</Button>
              </div>
            </form>
          </Panel>
          <Panel title="Chart-of-accounts mapping" description="Draft mapping · double-entry posting preview">
            <DataTable
              data={LEDGER_MAPPINGS}
              showPagination={false}
              columns={[
                { accessorKey: "event", header: "Event" },
                { accessorKey: "debitAccount", header: "Debit account" },
                { accessorKey: "creditAccount", header: "Credit account" },
                { accessorKey: "state", header: "State" },
              ]}
            />
            <form
              noValidate
              className="space-y-4"
              onSubmit={posting.handleSubmit((values) => {
                const result = z.array(ledgerMappingSchema).safeParse(LEDGER_MAPPINGS);
                if (!result.success) {
                  toast.error("Invalid mapping. Debit and credit accounts must differ.");
                  return;
                }
                setValidated(values);
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FinanceText form={posting} name="reference" label="Posting reference" />
                <FinanceNumber form={posting} name="amount" label="Posting amount" prefix="₦" />
              </div>
              {validated && (
                <div role="status" className="space-y-2 text-sm">
                  <p>
                    Debit / credit totals: {money(validated.amount)} / {money(validated.amount)}
                  </p>
                  <p>Difference: {money(0)} · balanced preview</p>
                  <p className="text-xs text-muted-foreground">
                    Reference {validated.reference} · this check does not post to the ledger.
                  </p>
                </div>
              )}
              <Button type="submit" variant="outline">
                Validate mapping preview
              </Button>
            </form>
          </Panel>
        </div>
        <aside className="space-y-5">
          <Panel title="Customer linkage">
            <TextField
              id="banking-investor"
              label="Investor"
              value="Ada Okafor · CC-U014"
              onChange={() => {}}
              readOnly
            />
            <TextField
              id="banking-customer-ref"
              label="Symplus customer reference"
              value="Not linked"
              onChange={() => {}}
              readOnly
            />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt>KYC eligibility</dt>
              <dd>Awaiting complete verification</dd>
              <dt>Linkage state</dt>
              <dd>Blocked · unconfigured</dd>
            </dl>
            <Button disabled className="w-full">
              Create customer link
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                AppModal.open({
                  title: "Customer linkage requirements",
                  content: (
                    <Notice>
                      Complete investor KYC, verify customer identity and approve the sandbox connection first. The
                      server must then create an idempotent customer link and retain the returned reference. No customer
                      data has been sent.
                    </Notice>
                  ),
                })
              }
            >
              Review linkage requirements
            </Button>
          </Panel>
          <Panel title="Balance sync preview">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt>City Core wallet</dt>
              <dd>{money(1250000)}</dd>
              <dt>Symplus balance</dt>
              <dd>Unavailable</dd>
              <dt>Variance</dt>
              <dd>Not calculated</dd>
              <dt>Last successful sync</dt>
              <dd>Never · unconfigured</dd>
            </dl>
            <Button disabled className="w-full">
              Run sandbox balance query
            </Button>
            <Notice>
              Never overwrite the wallet from an unverified remote balance. Differences create reconciliation
              exceptions.
            </Notice>
          </Panel>
          <Panel title="Production guardrail">
            <Notice>
              Production credentials are not shown. Switching environment requires a separate approved change, dual
              review and connection validation.
            </Notice>
            <Button
              variant="outline"
              disabled={!ready}
              onClick={() =>
                reviewBatch({
                  title: "Request environment review",
                  batchId: "SYMPLUS-PRODUCTION",
                  content: (
                    <Notice>
                      This records a local review request only. It does not switch environments, expose credentials or
                      contact a production endpoint.
                    </Notice>
                  ),
                  onSave: (v) =>
                    submit({
                      kind: "environment-review",
                      subjectId: "symplus-production",
                      summary: "Production environment review",
                      reason: v.reason,
                      details: { checkerId: v.checkerId, environment: "production" },
                    }),
                })
              }
            >
              Request environment review
            </Button>
          </Panel>
        </aside>
      </div>
      <Panel title="Posting & sync retry queue" description="Illustrative failed records · no live retry available">
        <DataTable
          data={BANKING_RETRIES}
          showPagination={false}
          getRowId={(r) => r.id}
          onRowClick={setSelected}
          rowClassName="cursor-pointer even:bg-muted/40"
          columns={[
            {
              accessorKey: "id",
              header: "Reference",
              cell: ({ row }) => (
                <button
                  type="button"
                  aria-pressed={row.original.id === selected.id}
                  className="cursor-pointer text-left font-medium text-foreground hover:underline"
                  onClick={() => setSelected(row.original)}
                >
                  {row.original.id === selected.id ? "● " : ""}
                  {row.original.id}
                </button>
              ),
            },
            { accessorKey: "operation", header: "Operation" },
            { accessorKey: "failure", header: "Failure" },
            { accessorKey: "nextStep", header: "Next step" },
            { accessorKey: "state", header: "State", cell: ({ row }) => <StatusBadge value={row.original.state} /> },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              AppModal.open({
                title: `Masked payload · ${selected.id}`,
                content: (
                  <div className="space-y-4">
                    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs/6">
                      {JSON.stringify(
                        {
                          reference: selected.originalReference,
                          operation: selected.operation,
                          idempotencyKey: selected.idempotencyKey,
                          environment: "sandbox",
                          state: selected.state,
                        },
                        null,
                        2
                      )}
                    </pre>
                    <Notice>
                      No credentials, full account numbers or sensitive identity identifiers are included in this
                      preview.
                    </Notice>
                  </div>
                ),
              })
            }
          >
            Inspect selected payload
          </Button>
          <Button disabled>Query original status</Button>
          <Button disabled>Retry idempotent posting</Button>
        </div>
        <Notice>
          Original references and idempotency keys must be preserved. A timeout does not establish non-settlement. Retry
          remains blocked until the original status is verified.
        </Notice>
      </Panel>
      {requests.some((r) => ["banking-config", "environment-review"].includes(r.kind)) && (
        <Panel title="Local integration review requests">
          <DataTable
            pageSize={5}
            data={requests.filter((r) => ["banking-config", "environment-review"].includes(r.kind))}
            columns={[
              { accessorKey: "summary", header: "Request" },
              { accessorKey: "reason", header: "Reason" },
              { accessorKey: "state", header: "State" },
            ]}
          />
        </Panel>
      )}
    </>
  );
}
