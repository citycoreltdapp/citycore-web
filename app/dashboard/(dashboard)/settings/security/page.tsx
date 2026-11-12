"use client";

import { useState } from "react";

import { useChangePassword, useCurrentUser, useSetPassword } from "@/actions/auth";
import { AppModal } from "@/components/primitives/app-modal";
import { PasswordField } from "@/components/primitives/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { type TwoFactorSelection, twoFactorPreferencesFormSchema } from "@/constant/schemas/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon, Shield01Icon, SmartPhone01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PASSWORD_RULES, newPasswordSchema, passwordSchema } from "../_schemas";
import { useSettings } from "../_settings-provider";
import { FormActions, SettingsNavigation, SettingsPanel } from "../_shared";

function SecurityIllustration() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[10/3] w-full max-w-100">
      <div className="absolute top-[11%] left-[20%] h-[35%] w-[60%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <div className="absolute top-[30%] left-[18%] h-[37%] w-[64%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <div className="absolute top-[50%] left-[14%] h-[38%] w-[72%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <span className="absolute" style={{ inset: "12.26% 38.59% 0.01% 49.56%" }}>
        <Image src="/assets/images/security/shield-1.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "10.43% 38.59% 87.23% 59.35%" }}>
        <Image src="/assets/images/security/shield-2.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "0 39.08% 89.06% 49.16%" }}>
        <Image src="/assets/images/security/shield-3.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "10.14% 57.81% 89.06% 39.03%" }}>
        <Image src="/assets/images/security/shield-4.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "0.51% 40.16% 0 38.59%" }}>
        <Image src="/assets/images/security/shield-5.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "41.47% 49.78% 44.83% 48.34%" }}>
        <Image src="/assets/images/security/shield-6.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "6.81% 41.21% 5.09% 40%" }}>
        <Image src="/assets/images/security/shield-7.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "5.48% 41.21% 4.97% 39.67%" }}>
        <Image src="/assets/images/security/shield-8.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "38.06% 45.87% 38.59% 44.95%" }}>
        <Image src="/assets/images/security/shield-9.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "23.14% 47.79% 63.29% 51.24%" }}>
        <Image src="/assets/images/security/shield-10.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "36.71% 46.03% 39.17% 44.5%" }}>
        <Image src="/assets/images/security/shield-11.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "19.86% 47.96% 63.79% 46.31%" }}>
        <Image src="/assets/images/security/shield-12.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "40.89% 49.99% 52.59% 48.19%" }}>
        <Image src="/assets/images/security/shield-13.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "24.49% 48.81% 63.29% 47.33%" }}>
        <Image src="/assets/images/security/shield-14.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "35.63% 47.95% 63.29% 51.18%" }}>
        <Image src="/assets/images/security/shield-15.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "23.9% 49.36% 63.29% 47.17%" }}>
        <Image src="/assets/images/security/shield-16.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "35.63% 52.82% 63.29% 46.33%" }}>
        <Image src="/assets/images/security/shield-17.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "48.18% 50.94% 45% 48.83%" }}>
        <Image src="/assets/images/security/shield-18.svg" alt="" fill className="object-contain" />
      </span>
    </div>
  );
}

const OPTIONS = [
  {
    id: "authenticator",
    title: "Authenticator app",
    description: "Use an authenticator app to generate verification codes.",
    icon: Shield01Icon,
  },
  { id: "sms", title: "Phone number", description: "Set up SMS verification on your number.", icon: SmartPhone01Icon },
  { id: "email", title: "Email", description: "Use email for 2-step verification.", icon: Mail01Icon },
] as const;

function TwoFactorSetup({
  initialSelection,
  onSave,
}: {
  initialSelection: TwoFactorSelection;
  onSave: (selection: TwoFactorSelection) => void;
}) {
  const form = useForm({ resolver: zodResolver(twoFactorPreferencesFormSchema), defaultValues: initialSelection });
  const selection = useWatch({ control: form.control });
  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl items-center">
      <Card className="w-full py-0 ring-0">
        <CardContent className="grid gap-8 p-4 md:grid-cols-[minmax(230px,0.75fr)_minmax(0,1.5fr)] md:p-6 lg:gap-12">
          <div className="relative min-h-64 overflow-hidden rounded-2xl md:min-h-120">
            <Image
              src="/assets/images/security/security-portrait.png"
              alt="A woman using her phone"
              fill
              priority
              sizes="(min-width: 768px) 35vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-black/90" />
            <div className="absolute inset-x-5 bottom-8 space-y-3 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-accent px-1.5 py-1 text-lg font-semibold text-accent-foreground">
                  City Core
                </span>
                <span className="text-xs">Ana is secured with</span>
              </div>
              <p className="max-w-72 text-2xl leading-tight font-semibold lg:text-3xl">
                Security is our top priority, get started.
              </p>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-lg flex-col justify-center gap-5">
            <h2 className="text-center text-xl font-semibold">Setup 2-Step Verification</h2>
            <SecurityIllustration />
            <div className="space-y-6">
              {OPTIONS.map((option) => (
                <div key={option.id} className="flex items-start gap-3">
                  <HugeiconsIcon icon={option.icon} className="mt-0.5 size-6 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor={`two-factor-${option.id}`} className="text-sm font-semibold">
                        {option.title}
                      </label>
                      {selection[option.id] && (
                        <Badge variant="secondary" className="text-[10px]">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    id={`two-factor-${option.id}`}
                    aria-label={option.title}
                    checked={selection[option.id]}
                    onCheckedChange={(checked) => form.setValue(option.id, checked, { shouldValidate: true })}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
            <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              Setup preview only. Saving selects your preferred methods; 2FA stays inactive until verification services
              are connected.
            </p>
            <div className="flex justify-end gap-3 border-t pt-5">
              <Button variant="ghost" className="h-10 rounded-full px-4" onClick={() => AppModal.close()}>
                Cancel
              </Button>
              <Button
                className="h-10 rounded-full px-5"
                disabled={!Object.values(selection).some(Boolean)}
                onClick={form.handleSubmit((values) => {
                  onSave(values);
                  toast.info(
                    "2FA preferences saved for this settings session. Two-factor authentication has not been enabled."
                  );
                  AppModal.close();
                })}
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
      {["Apple"].map((provider) => (
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
  const { data: user } = useCurrentUser();
  const changePassword = useChangePassword();
  const setPassword = useSetPassword();
  const hasPassword = user?.hasPassword ?? true;
  const form = useForm({
    resolver: zodResolver(hasPassword ? passwordSchema : newPasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const savePassword = form.handleSubmit(({ oldPassword, newPassword }) => {
    const done = {
      onSuccess: () => {
        form.reset();
        toast.success(hasPassword ? "Password changed. Other devices have been signed out." : "Password set");
      },
      onError: (error: Error & { code?: string }) =>
        error.code === "INVALID_CURRENT_PASSWORD"
          ? form.setError("oldPassword", { message: "Your current password is incorrect" }, { shouldFocus: true })
          : toast.error(error.message),
    };
    if (hasPassword) changePassword.mutate({ currentPassword: oldPassword, newPassword }, done);
    else setPassword.mutate({ newPassword }, done);
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

      <SettingsPanel title={hasPassword ? "Change Password" : "Set a Password"}>
        <form className="flex flex-col gap-5" noValidate onSubmit={savePassword}>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              {hasPassword && (
                <Controller
                  control={form.control}
                  name="oldPassword"
                  render={({ field, fieldState }) => (
                    <PasswordField
                      {...field}
                      id="settings-old-password"
                      label="Current Password"
                      autoComplete="current-password"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              )}
              <Controller
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <PasswordField
                    {...field}
                    id="settings-new-password"
                    label="New Password"
                    autoComplete="new-password"
                    maxLength={72}
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
          <FormActions onCancel={() => form.reset()} isPending={changePassword.isPending || setPassword.isPending} />
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

export default Client$SecuritySettingsPage;
