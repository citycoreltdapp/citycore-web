"use client";

import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DataTable } from "@/components/primitives/data-table";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  type MatrixChange,
  type PlatformState,
  adminPlatformStateSchema,
  platformMatrixChangeSchema,
} from "@/constant/schemas/admin-platform";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FinanceNumber, money } from "../_operations/treasury-ui";
import { Notice, PageLink, PageTitle, Panel } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { CONFIG_HISTORY, PLATFORM_DEFAULTS } from "./_data";

export function PlatformPage() {
  const store = usePreviewState("citycore-admin-platform-v1", adminPlatformStateSchema, PLATFORM_DEFAULTS);
  return (
    <>
      <PageTitle
        title="Platform Configuration"
        description="Global fees, limits and environment controls · changes require a recorded reason and approval."
      >
        <PageLink href="/platform/banking">Core banking</PageLink>
      </PageTitle>
      <Notice>
        Sandbox settings preview. Saving a draft does not activate production configuration. Any production change
        requires an independent approver and explicit environment confirmation.
      </Notice>
      {store.ready ? <Configuration initialValue={store.value} save={store.save} /> : <Skeleton className="h-96" />}
    </>
  );
}
function Configuration({ initialValue, save }: { initialValue: PlatformState; save: (v: PlatformState) => boolean }) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [historyStatus, setHistoryStatus] = useState(initialValue.status);
  const form = useForm<MatrixChange>({
    resolver: zodResolver(platformMatrixChangeSchema),
    defaultValues: {
      operation: "withdrawal",
      fee: 50,
      perTransaction: 2000000,
      dailyLimit: 5000000,
    },
  });
  function update<K extends keyof PlatformState>(key: K, next: PlatformState[K]) {
    setValue((current) => ({ ...current, [key]: next, status: "draft" }));
    setSaved(false);
  }
  function persist(status: "draft" | "pending") {
    const next = { ...value, status };
    if (save(next)) {
      setValue(next);
      setSaved(true);
      setHistoryStatus(status);
      toast.success(status === "pending" ? "Configuration submitted for local review" : "Configuration draft saved");
    }
  }
  const date = (v: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Lagos",
    }).format(new Date(`${v}:00+01:00`));
  return (
    <>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <Panel title="Global fee & limit matrix" description="NGN · proposed configuration v2.4">
            <DataTable
              data={value.matrix}
              showPagination={false}
              cellClassName="align-top whitespace-normal"
              columns={[
                { accessorKey: "label", header: "Operation" },
                {
                  accessorKey: "fee",
                  header: "Fee",
                  cell: ({ row }) =>
                    row.original.fee === 0
                      ? row.original.operation === "funding"
                        ? "₦0 platform fee"
                        : "₦0"
                      : `${money(row.original.fee)} flat`,
                },
                {
                  accessorKey: "perTransaction",
                  header: "Per transaction",
                  cell: ({ row }) =>
                    row.original.perTransaction === null ? "Available units" : money(row.original.perTransaction),
                },
                {
                  accessorKey: "dailyLimit",
                  header: "Daily limit",
                  cell: ({ row }) =>
                    row.original.dailyLimit === null ? "Wallet available" : money(row.original.dailyLimit),
                },
                {
                  accessorKey: "eligibility",
                  header: "Eligibility",
                  cell: ({ row }) => (
                    <span
                      className={
                        ["withdrawal", "electricity", "airtime"].includes(row.original.operation)
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {row.original.eligibility}
                    </span>
                  ),
                },
              ]}
            />
            <form
              noValidate
              className="space-y-4"
              onSubmit={form.handleSubmit((change) => {
                update(
                  "matrix",
                  value.matrix.map((row) =>
                    row.operation === change.operation
                      ? {
                          ...row,
                          fee: change.fee,
                          perTransaction: change.perTransaction,
                          dailyLimit: change.dailyLimit,
                        }
                      : row
                  )
                );
                toast.success("Matrix change added to draft");
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="operation"
                  render={({ field, fieldState }) => (
                    <SelectField
                      id="platform-operation"
                      label="Operation to edit"
                      value={field.value}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      items={value.matrix
                        .filter((row) => row.perTransaction !== null)
                        .map((row) => ({ value: row.operation, label: row.label }))}
                      onChange={(operation) => {
                        const row = value.matrix.find((row) => row.operation === operation);
                        if (row && row.perTransaction !== null && row.dailyLimit !== null)
                          form.reset({
                            operation: row.operation,
                            fee: row.fee,
                            perTransaction: row.perTransaction,
                            dailyLimit: row.dailyLimit,
                          });
                      }}
                    />
                  )}
                />
                <FinanceNumber form={form} name="fee" label="Flat fee" prefix="₦" />
                <FinanceNumber form={form} name="perTransaction" label="Per-transaction limit" prefix="₦" />
                <FinanceNumber form={form} name="dailyLimit" label="Daily aggregate limit" prefix="₦" />
              </div>
              <p className="text-xs/5 text-muted-foreground">
                The stricter account-tier, available-balance or global limit applies. High-value withdrawals still
                require the treasury approval workflow.
              </p>
              <Button type="submit" variant="secondary">
                Add matrix change to draft
              </Button>
            </form>
          </Panel>
          <Panel
            title="Maintenance mode"
            description={`Custom splash preview · mode is currently ${value.maintenance ? "on in draft" : "off"}`}
          >
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="space-y-1">
                <span className="block font-medium">Enable scheduled maintenance</span>
                <span className="block text-xs text-muted-foreground">Draft only; activation requires approval</span>
              </span>
              <Switch
                checked={value.maintenance}
                onCheckedChange={(v) => update("maintenance", v)}
                aria-label="Enable scheduled maintenance"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="maintenance-start"
                type="datetime-local"
                label="Window start · WAT"
                value={value.windowStart}
                onChange={(v) => update("windowStart", v)}
              />
              <TextField
                id="maintenance-end"
                type="datetime-local"
                label="Window end · WAT"
                value={value.windowEnd}
                onChange={(v) => update("windowEnd", v)}
              />
            </div>
            <TextField
              id="maintenance-headline"
              label="Splash headline"
              value={value.headline}
              onChange={(v) => update("headline", v)}
            />
            <TextAreaField
              id="maintenance-message"
              label="Splash message"
              value={value.message}
              onChange={(v) => update("message", v)}
              rows={2}
            />
            <div className="space-y-4 rounded-xl bg-muted/60 p-5">
              <h2 className="text-lg font-semibold">City Core · {value.headline}</h2>
              <p className="text-sm/6 text-muted-foreground">{value.message}</p>
              <p className="text-xs text-muted-foreground">
                {value.windowEnd && !Number.isNaN(Date.parse(`${value.windowEnd}:00+01:00`))
                  ? `Please check back at ${date(value.windowEnd)} WAT.`
                  : "Choose a maintenance end time."}
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  AppModal.open({
                    title: "Contact support",
                    description: "Maintenance support preview",
                    content: (
                      <p className="text-sm/6">
                        Emergency support remains accessible while maintenance is active. The existing helpdesk can be
                        reached from Support in the admin sidebar.
                      </p>
                    ),
                  })
                }
              >
                Contact support
              </Button>
            </div>
            <p className="text-xs/5 text-muted-foreground">
              Emergency support remains accessible. In the product, maintenance blocks new financial submissions rather
              than pretending they succeed.
            </p>
          </Panel>
        </div>
        <aside className="min-w-0 space-y-5">
          <Panel title="Locale & environment">
            <SelectField
              id="platform-currency"
              label="Currency"
              value={value.currency}
              onChange={() => {}}
              items={[{ value: "NGN", label: "NGN · Nigerian naira" }]}
            />
            <SelectField
              id="platform-timezone"
              label="Timezone"
              value={value.timezone}
              onChange={() => {}}
              items={[{ value: "Africa/Lagos", label: "Africa/Lagos · WAT (UTC+1)" }]}
            />
            <SelectField
              id="platform-date-format"
              label="Date format"
              value={value.dateFormat}
              onChange={(v) => update("dateFormat", v as PlatformState["dateFormat"])}
              items={["DD MMM YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((v) => ({ value: v, label: v }))}
            />
            <TextField
              id="platform-environment"
              label="Active environment"
              value="Sandbox"
              onChange={() => {}}
              readOnly
            />
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              Production switch locked
            </Badge>
            <Notice>
              Production access requires approved credentials, verified integrations, dual review and a separately
              recorded change request. No live connection is represented.
            </Notice>
            <Button
              variant="secondary"
              className="h-auto min-h-8 w-full whitespace-normal"
              onClick={() =>
                AppModal.open({
                  title: "Production readiness review",
                  description: "Sandbox configuration remains active",
                  content: (
                    <div className="space-y-4">
                      <p className="text-sm/6">
                        Production requires approved credentials, verified integrations, an independent reviewer and a
                        recorded environment change request.
                      </p>
                      <Notice>
                        Review the existing core banking configuration before requesting production access. This preview
                        does not switch environments.
                      </Notice>
                      <PageLink href="/platform/banking">Review core banking</PageLink>
                    </div>
                  ),
                })
              }
            >
              Request production readiness review
            </Button>
          </Panel>
          <Panel title="Review & save configuration">
            <TextAreaField
              id="platform-reason"
              label="Recorded change reason"
              value={value.reason}
              onChange={(v) => update("reason", v)}
              rows={3}
            />
            <TextField
              id="platform-reference"
              label="Change reference"
              value={value.reference}
              onChange={(v) => update("reference", v)}
            />
            <SelectField
              id="platform-approver"
              label="Independent approver"
              value={value.approver}
              onChange={(v) => update("approver", v as PlatformState["approver"])}
              items={[
                { value: "staff-nneka", label: "Nneka Eze · Super Admin" },
                { value: "staff-amaka", label: "Amaka Obi · Super Admin" },
              ]}
            />
            <label className="flex items-start gap-2 text-xs/5">
              <Checkbox
                checked={value.reviewed}
                onCheckedChange={(v) => update("reviewed", v === true)}
                aria-label="I reviewed fee impact and investor-facing notices"
              />
              <span>I reviewed fee impact and investor-facing notices.</span>
            </label>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-xs/5 text-muted-foreground">
              <dt>Version</dt>
              <dd>Draft v2.4</dd>
              <dt>Maker</dt>
              <dd>Tunde Bello</dd>
              <dt>Status</dt>
              <dd>
                {value.status === "pending" ? "Awaiting product / engineering review" : "Draft · awaiting review"}
              </dd>
              <dt>Effective date</dt>
              <dd>Only after approval</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => persist("draft")}>
                Save draft
              </Button>
              <Button onClick={() => persist("pending")} disabled={value.status === "pending"}>
                Submit approval
              </Button>
            </div>
            {saved && (
              <p role="status" className="rounded-lg bg-success/10 p-3 text-xs/5 text-success">
                {value.status === "pending" ? "Review request saved" : "Draft saved"} · {value.reference}. No live
                setting has changed. Approval is still required.
              </p>
            )}
            <Button disabled className="w-full">
              Activate production changes
            </Button>
          </Panel>
        </aside>
      </div>
      <Panel title="Configuration history · read only">
        <DataTable
          showPagination={false}
          data={[
            {
              version: "v2.4",
              change: "Fee / limit alignment draft",
              actor: "Tunde Bello",
              approval: historyStatus === "pending" ? "Pending review" : "Draft",
              effective: "Not active",
            },
            ...CONFIG_HISTORY,
          ]}
          cellClassName="align-top whitespace-normal"
          columns={[
            { accessorKey: "version", header: "Version" },
            { accessorKey: "change", header: "Change" },
            { accessorKey: "actor", header: "Actor" },
            {
              accessorKey: "approval",
              header: "Approval",
              cell: ({ row }) => (
                <span className={row.original.version === "v2.4" ? "text-warning" : "text-success"}>
                  {row.original.approval}
                </span>
              ),
            },
            { accessorKey: "effective", header: "Effective" },
          ]}
        />
      </Panel>
      <footer className="flex flex-wrap justify-between gap-3 py-2 text-xs text-muted-foreground">
        <p>City Core Ltd · Illustrative design data · Platform aggregates, not investor balances</p>
        <p>Privacy · Terms · Help</p>
      </footer>
    </>
  );
}
