"use client";
import { AppModal } from "@/components/primitives/app-modal";
import { OtpField } from "@/components/primitives/otp-field";
import { Button } from "@/components/ui/button";
import { adminPinFormSchema } from "@/constant/schemas/admin-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Notice, Panel, StatusBadge } from "../_operations/ui";

export function SecurityExtras() {
  const form = useForm<z.infer<typeof adminPinFormSchema>>({
    resolver: zodResolver(adminPinFormSchema),
    defaultValues: { pin: "", confirmPin: "" },
  });
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Panel title="Transaction PIN" description="Protect wallet debits with a separate 4-digit PIN">
        <StatusBadge value="not-configured" />
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit(() => {
            form.reset();
            toast.info("PIN service is not connected. No PIN was set or stored.");
          })}
        >
          <Controller
            name="pin"
            control={form.control}
            render={({ field, fieldState }) => (
              <OtpField
                {...field}
                id="admin-pin"
                label="New 4-digit PIN"
                length={4}
                mask
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="confirmPin"
            control={form.control}
            render={({ field, fieldState }) => (
              <OtpField
                {...field}
                id="admin-pin-confirm"
                label="Confirm PIN"
                length={4}
                mask
                error={fieldState.error?.message}
              />
            )}
          />
          <Button type="submit">Set transaction PIN</Button>
        </form>
        <Notice>
          Preview only: do not enter a real PIN. Verification is required to reset a PIN in the connected product.
        </Notice>
      </Panel>
      <Panel title="Active session" description="Illustrative session · not an authentication record">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt>Device</dt>
          <dd>Chrome · web</dd>
          <dt>Location</dt>
          <dd>Lagos · approximate</dd>
          <dt>Last active</dt>
          <dd>22 Oct 2026 · 11:02 WAT</dd>
        </dl>
        <Button
          variant="outline"
          onClick={() =>
            AppModal.open({
              title: "Sign out other sessions",
              content: (
                <Notice>The session service is not connected. No sessions can be revoked from this preview.</Notice>
              ),
              secondaryButton: { children: "Close" },
            })
          }
        >
          Sign out other sessions
        </Button>
      </Panel>
    </div>
  );
}
