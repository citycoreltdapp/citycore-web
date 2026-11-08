"use client";

import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminPaymentLimitsSchema } from "@/constant/schemas/admin-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useReviewRequests } from "../../_operations/requests";
import { money, reviewBatch } from "../../_operations/treasury-ui";
import { Notice, PageLink, Panel } from "../../_operations/ui";
import { usePreviewState } from "../../_operations/use-preview-state";
import { LIMIT_DEFAULTS } from "../../_operations/workspace-data";

type Values = z.infer<typeof adminPaymentLimitsSchema>;
const GROUPS = [
  {
    title: "Payment Limits",
    fields: [
      { name: "cashWithdrawal", label: "Cash withdrawal" },
      { name: "privateTransaction", label: "Private Transaction" },
      { name: "onlinePayment", label: "Online Payment" },
    ],
  },
  {
    title: "Transaction Limits",
    fields: [
      { name: "storePurchase", label: "One-time purchase in store" },
      { name: "onlinePurchase", label: "One-time purchase online" },
      { name: "zipTransfer", label: "One-time zip transfer" },
    ],
  },
] as const;
export default function PaymentLimits() {
  const store = usePreviewState("citycore-admin-payment-limits-v1", adminPaymentLimitsSchema, LIMIT_DEFAULTS);
  if (!store.ready) return <Skeleton className="h-96" />;
  return <LimitsForm value={store.value} save={store.save} />;
}
function LimitsForm({ value, save }: { value: Values; save: (v: Values) => boolean }) {
  const { submit, ready } = useReviewRequests();
  const form = useForm<Values>({ resolver: zodResolver(adminPaymentLimitsSchema), defaultValues: value });
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-semibold">Payment Limits</h2>
        <PageLink href="/admin/settings/security">Profile Security</PageLink>
      </div>
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          if (save(v)) {
            form.reset(v);
            toast.success("Limit draft saved locally. Live account limits are unchanged.");
          }
        })}
      >
        {GROUPS.map((group) => (
          <Panel key={group.title} title={group.title}>
            {group.fields.map((item) => (
              <Controller
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field, fieldState }) => (
                  <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Illustrative amount spent: {money(2510)}</p>
                      </div>
                      <NumberField
                        {...field}
                        id={`limit-${item.name}`}
                        label={`${item.label} limit`}
                        prefix="₦"
                        error={fieldState.error?.message}
                      />
                    </div>
                    <input
                      type="range"
                      className="w-full accent-primary"
                      min={0}
                      max={10000000}
                      step={10000}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      aria-label={`${item.label} limit slider`}
                    />
                    <p className="text-right text-xs text-muted-foreground">Preview maximum: {money(10000000)}</p>
                  </div>
                )}
              />
            ))}
          </Panel>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save Change</Button>
          <Button variant="outline" type="button" onClick={() => form.reset(value)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!ready}
            onClick={form.handleSubmit((v) =>
              reviewBatch({
                title: "Review payment-limit changes",
                batchId: "ADMIN-LIMITS",
                content: (
                  <Notice>
                    All six limits will be submitted as a local review request. No live payment capability is changed.
                  </Notice>
                ),
                onSave: (r) =>
                  submit({
                    kind: "payment-limits",
                    subjectId: "admin-limits",
                    summary: "Payment and transaction limit review",
                    reason: r.reason,
                    details: { ...v, checkerId: r.checkerId },
                  }),
              })
            )}
          >
            Request limit review
          </Button>
        </div>
        <Notice>
          These are draft values, not authorization to spend or move funds. Server policy, account tier and independent
          approvals determine actual limits.
        </Notice>
      </form>
    </>
  );
}
