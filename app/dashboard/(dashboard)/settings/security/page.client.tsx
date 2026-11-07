"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { PasswordField } from "@/components/primitives/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon, Shield01Icon, SmartPhone01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PASSWORD_RULES, passwordSchema } from "../_schemas";
import { useSettings } from "../_settings-provider";
import { FormActions, SettingsNavigation, SettingsPanel } from "../_shared";
import { TwoFactorSetup } from "./_two-factor-setup";

const METHODS = [
  {
    id: "authenticator",
    title: "Authentication app",
    description: "Google Authenticator or another TOTP app",
    icon: Shield01Icon,
  },
  {
    id: "email",
    title: "Primary email",
    description: "Verification codes sent to your verified email",
    icon: Mail01Icon,
  },
  {
    id: "sms",
    title: "SMS Recovery",
    description: "Recovery codes sent to your verified phone number",
    icon: SmartPhone01Icon,
  },
] as const;

function SocialConnections() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect a social account for sign-in. Social sign-in is not available in this preview.
      </p>
      {["Google", "Apple"].map((provider) => (
        <div key={provider} className="flex items-center justify-between gap-3 rounded-xl border p-4">
          <span className="text-sm font-semibold">{provider}</span>
          <Button
            variant="outline"
            className="rounded-full px-4"
            onClick={() => toast.info(`${provider} sign-in isn't connected yet.`)}
          >
            Connect {provider}
          </Button>
        </div>
      ))}
    </div>
  );
}

export function Client$SecuritySettingsPage({ showNavigation = true }: { showNavigation?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const { twoFactorSelection, setTwoFactorSelection } = useSettings();
  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const metRules = PASSWORD_RULES.filter((rule) => rule.test(newPassword)).length;
  const setup = (method: (typeof METHODS)[number]) =>
    AppModal.open({
      title: "Multi Step Security",
      size: "full",
      content: (
        <TwoFactorSetup
          initialSelection={{ ...twoFactorSelection, [method.id]: true }}
          onSave={setTwoFactorSelection}
        />
      ),
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showNavigation && <SettingsNavigation />}
        <Button
          className="h-10 rounded-full px-5"
          onClick={() =>
            AppModal.open({
              title: "Set up socials",
              description: "Manage connected sign-in accounts",
              content: <SocialConnections />,
              secondaryButton: { children: "Close" },
            })
          }
        >
          Set up socials
        </Button>
      </div>

      <SettingsPanel title="Change Password">
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(() => {
            toast.info("Password changes aren't connected yet. Your password has not changed.");
            form.reset();
          })}
        >
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <Controller
                control={form.control}
                name="oldPassword"
                render={({ field, fieldState }) => (
                  <PasswordField
                    {...field}
                    id="settings-old-password"
                    label="Old Password"
                    autoComplete="current-password"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <PasswordField
                    {...field}
                    id="settings-new-password"
                    label="New Password"
                    autoComplete="new-password"
                    maxLength={128}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <PasswordField
                    {...field}
                    id="settings-confirm-password"
                    label="Confirm Password"
                    autoComplete="new-password"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <p className="font-semibold">New password must contain</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {metRules}/{PASSWORD_RULES.length}
                </p>
              </div>
              <Progress
                aria-label="Password requirements met"
                value={(metRules / PASSWORD_RULES.length) * 100}
                className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-accent"
              />
              <ul className="flex flex-col gap-2 text-xs">
                {PASSWORD_RULES.map((rule) => {
                  const isMet = rule.test(newPassword);
                  return (
                    <li
                      key={rule.label}
                      className={cn("flex items-center gap-2", isMet ? "text-success" : "text-muted-foreground")}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full",
                          isMet ? "bg-success text-white" : "border border-input"
                        )}
                      >
                        {isMet && <HugeiconsIcon icon={Tick02Icon} className="size-3" />}
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <FormActions onCancel={() => form.reset()} />
        </form>
      </SettingsPanel>

      <SettingsPanel
        title="Two-Factor Authentication"
        description="Add a second sign-in step to protect your account."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">Not configured</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              aria-expanded={expanded}
              aria-controls="two-factor-methods"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        }
      >
        {expanded && (
          <div id="two-factor-methods" className="flex flex-col gap-4">
            <div className="divide-y divide-border rounded-xl border border-border">
              {METHODS.map((method) => (
                <div key={method.id} className="flex items-center gap-3 p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <HugeiconsIcon icon={method.icon} aria-hidden className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`settings-${method.id}`} className="block text-sm font-semibold">
                      {method.title}
                    </label>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <Switch
                    id={`settings-${method.id}`}
                    checked={false}
                    onCheckedChange={() => setup(method)}
                    aria-label={`Set up ${method.title}`}
                  />
                </div>
              ))}
            </div>
            <p className="max-w-prose text-xs/5 text-muted-foreground">
              Keep recovery details private and store recovery codes somewhere safe. Email and SMS methods require
              verified contact details. Select a method to review the setup steps.
            </p>
          </div>
        )}
      </SettingsPanel>
    </>
  );
}
