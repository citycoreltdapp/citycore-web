"use client";
import * as React from "react";

import { PasswordField } from "@/components/primitives/password-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { type BankingConfigForm, bankingConfigFormSchema } from "@/constant/schemas/admin-treasury";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";

import { FinanceNumber, FinanceSelect, FinanceText } from "../../_operations/treasury-ui";
import { StatusPill } from "../../account/_ui";
import { CardHeader, type Reviews, Section } from "../../content/_ui";

const DEFAULTS: BankingConfigForm = {
  environment: "sandbox",
  endpoint: "https://sandbox.example.invalid/symplus",
  clientId: "",
  tenant: "",
  timeoutSeconds: 30,
  reason: "Initial sandbox setup for integration review",
};

function RequestPreview({ form }: { form: UseFormReturn<BankingConfigForm> }) {
  const values = useWatch({ control: form.control });
  const payload = {
    environment: values.environment,
    endpoint: values.endpoint,
    clientId: values.clientId || "—",
    tenant: values.tenant || "—",
    timeoutSeconds: values.timeoutSeconds,
    secret: "server secret store",
  };
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8 xl:sticky xl:top-24">
      <CardHeader title="Review payload" note="What the approver sees · no secrets leave the server" />
      <pre className="overflow-x-auto rounded-xl bg-[#121212] p-4 text-xs/6 text-white/80">
        {JSON.stringify(payload, null, 2)}
      </pre>
      <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
        {["HTTPS base URL only", "No credentials in query or fragment", "Timeout between 5 and 120 seconds"].map(
          (rule) => (
            <li key={rule} className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-foreground/30" />
              {rule}
            </li>
          )
        )}
      </ul>
    </Card>
  );
}

export function ConnectionTab({ reviews }: { reviews: Reviews }) {
  const { submit, ready, requests } = reviews;
  const form = useForm<BankingConfigForm>({ resolver: zodResolver(bankingConfigFormSchema), defaultValues: DEFAULTS });
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    const draft = requests.find((r) => r.kind === "banking-config");
    if (!draft) return;
    const parsed = bankingConfigFormSchema.safeParse(draft.details);
    if (parsed.success) form.reset(parsed.data);
  }, [ready, requests, form]);
  const saved = requests.some((r) => r.kind === "banking-config");

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
        <form
          noValidate
          onSubmit={form.handleSubmit((values) =>
            submit(
              {
                kind: "banking-config",
                subjectId: "symplus-sandbox",
                summary: "Symplus sandbox configuration draft",
                reason: values.reason,
                details: { ...values },
              },
              { replaceDraft: true }
            )
          )}
        >
          <div className="border-b border-border p-5">
            <CardHeader title="Connection" note="Restricted to authorized integration administrators">
              <StatusPill tone={saved ? "warning" : "muted"}>{saved ? "Draft in review" : "Unconfigured"}</StatusPill>
            </CardHeader>
          </div>
          <Section step={1} title="Endpoint">
            <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <FinanceSelect
                form={form}
                name="environment"
                label="Environment"
                items={[{ value: "sandbox", label: "Sandbox" }]}
              />
              <FinanceText form={form} name="endpoint" label="Base endpoint" />
            </div>
            <div className="sm:w-48">
              <FinanceNumber form={form} name="timeoutSeconds" label="Timeout (seconds)" />
            </div>
          </Section>
          <Section step={2} title="Credentials">
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceText form={form} name="clientId" label="Client identifier (non-secret)" />
              <FinanceText form={form} name="tenant" label="Tenant / branch" />
              <div className="sm:col-span-2">
                <PasswordField
                  id="symplus-secret"
                  label="API secret"
                  value=""
                  onChange={() => {}}
                  disabled
                  placeholder="Configure in server secret store"
                  helpText="Credentials are never stored in browser drafts."
                />
              </div>
            </div>
          </Section>
          <Section step={3} title="Change">
            <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">Scheduled sync</span>
                <span className="block text-xs text-muted-foreground">Unavailable until configuration is approved</span>
              </span>
              <Switch aria-label="Enable scheduled sync" checked={false} disabled />
            </label>
            <FinanceText form={form} name="reason" label="Change reason" area />
          </Section>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
            <Button type="button" variant="ghost" className="h-10 rounded-full px-4" disabled>
              <HugeiconsIcon icon={LockIcon} aria-hidden />
              Test connection
            </Button>
            <Button type="submit" className="h-10 rounded-full px-5" disabled={!ready}>
              {saved ? "Update draft" : "Save configuration draft"}
            </Button>
          </div>
        </form>
      </Card>
      <RequestPreview form={form} />
    </div>
  );
}
