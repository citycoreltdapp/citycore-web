"use client";

import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  adminKinSchema,
  adminPersonalSchema,
  adminPersonalStateSchema,
  adminProfilePreferencesSchema,
} from "@/constant/schemas/admin-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceSelect, FinanceText } from "../../_operations/treasury-ui";
import { Notice, Panel } from "../../_operations/ui";
import { usePreviewState } from "../../_operations/use-preview-state";
import { PERSONAL_DEFAULTS } from "../../_operations/workspace-data";
import { SecurityExtras } from "../security/page";

type State = z.infer<typeof adminPersonalStateSchema>;
export default function PersonalSettings() {
  const store = usePreviewState("citycore-admin-personal-v1", adminPersonalStateSchema, PERSONAL_DEFAULTS);
  if (!store.ready) return <Skeleton className="h-96" />;
  return <PersonalForms value={store.value} save={store.save} />;
}
function PersonalForms({ value, save }: { value: State; save: (next: State) => boolean }) {
  const personal = useForm({ resolver: zodResolver(adminPersonalSchema), defaultValues: value.personal });
  const kin = useForm({ resolver: zodResolver(adminKinSchema), defaultValues: value.kin ?? PERSONAL_DEFAULTS.kin! });
  const preferences = useForm({
    resolver: zodResolver(adminProfilePreferencesSchema),
    defaultValues: value.preferences,
  });
  return (
    <>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Panel title="Personal details" description="Admin profile preview">
          <form
            noValidate
            className="space-y-4"
            onSubmit={personal.handleSubmit((v) => {
              if (save({ ...value, personal: v }))
                toast.success(
                  "Personal details saved locally. Email changes require re-verification in the live product."
                );
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceText form={personal} name="firstName" label="First name" />
              <FinanceText form={personal} name="lastName" label="Last name" />
            </div>
            <FinanceText form={personal} name="email" label="Email address" />
            <FinanceText form={personal} name="phone" label="Phone number" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceSelect
                form={personal}
                name="country"
                label="Country"
                items={[
                  { value: "NG", label: "Nigeria" },
                  { value: "GB", label: "United Kingdom" },
                  { value: "US", label: "United States" },
                ]}
              />
              <FinanceText form={personal} name="state" label="State" />
            </div>
            <FinanceText form={personal} name="address" label="Residential address" />
            <div className="flex gap-2">
              <Button type="submit">Save personal details</Button>
              <Button type="button" variant="outline" onClick={() => personal.reset(value.personal)}>
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Next of kin" description="For estate administration · does not grant account access">
          <form
            noValidate
            className="space-y-4"
            onSubmit={kin.handleSubmit((v) => {
              if (save({ ...value, kin: v })) toast.success("Next-of-kin preview saved locally");
            })}
          >
            <FinanceText form={kin} name="fullName" label="Full name" />
            <FinanceSelect
              form={kin}
              name="relationship"
              label="Relationship"
              items={["sibling", "spouse", "parent", "child", "other"].map((v) => ({
                value: v,
                label: v[0].toUpperCase() + v.slice(1),
              }))}
            />
            <FinanceText form={kin} name="email" label="Contact email" />
            <FinanceText form={kin} name="phone" label="Contact phone" />
            <FinanceText form={kin} name="address" label="Contact address" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save next of kin</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  AppModal.open({
                    title: "Remove next-of-kin contact?",
                    content: <Notice>This clears only the local preview contact.</Notice>,
                    primaryButton: {
                      children: "Remove local contact",
                      onClick: () => {
                        if (save({ ...value, kin: null })) {
                          kin.reset({ fullName: "", relationship: "other", email: "", phone: "", address: "" });
                          toast.success("Local contact removed");
                        }
                      },
                    },
                    secondaryButton: { children: "Cancel" },
                  })
                }
              >
                Remove contact
              </Button>
            </div>
          </form>
          {value.kin === null && <Notice>No next-of-kin contact is saved.</Notice>}
        </Panel>
      </div>
      <Panel title="Notification preferences">
        <form
          className="space-y-4"
          onSubmit={preferences.handleSubmit((v) => {
            if (save({ ...value, preferences: v })) toast.success("Profile preferences saved locally");
          })}
        >
          {(
            [
              { name: "receipts", label: "Transactions & receipts" },
              { name: "securityAlerts", label: "Security alerts · always on" },
              { name: "investmentUpdates", label: "Investment updates" },
              { name: "promotions", label: "Offers & market news" },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              name={item.name}
              control={preferences.control}
              render={({ field }) => (
                <label className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 p-3 text-sm">
                  <span>{item.label}</span>
                  <Switch
                    aria-label={item.label}
                    checked={field.value}
                    disabled={item.name === "securityAlerts"}
                    onCheckedChange={field.onChange}
                  />
                </label>
              )}
            />
          ))}
          <Button type="submit">Save preferences</Button>
        </form>
      </Panel>
      <SecurityExtras />
    </>
  );
}
