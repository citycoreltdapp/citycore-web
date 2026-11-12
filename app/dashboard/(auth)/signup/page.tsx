"use client";

import { Suspense } from "react";

import { FieldError } from "@/components/primitives/field";
import { PasswordField } from "@/components/primitives/password-field";
import { TextField } from "@/components/primitives/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type SignUpFormData, signUpSchema } from "@/constant/auth";
import { setAccountType } from "@/lib/account-type";
import { ReferralCodeError, resolveReferralCode } from "@/lib/referrals";
import { setReferredBy } from "@/lib/referred-by";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase01Icon,
  Building06Icon,
  Mail01Icon,
  Megaphone01Icon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthForm, AuthInvestorsBanner, AuthShell } from "../_shared";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "personal", label: "Personal", hint: "Investor", icon: UserIcon },
  { value: "corporate", label: "Corporate", hint: "Investor", icon: Building06Icon },
  { value: "esp", label: "Executive Sales", hint: "Partner", icon: Briefcase01Icon },
  { value: "staff", label: "Staff", hint: "Marketer", icon: Megaphone01Icon },
] as const;

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: "personal",
      referrer: searchParams.get("ref")?.toUpperCase() ?? "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onTouched",
  });

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <AuthForm
      title="Get Started Now"
      subtitle="Let’s create your account"
      onSubmit={form.handleSubmit(async ({ accountType, referrer: code }) => {
        let referrer = null;
        if (code) {
          try {
            referrer = await resolveReferralCode(code);
          } catch (error) {
            const message =
              error instanceof ReferralCodeError ? error.message : "Could not check this code. Try again.";
            form.setError("referrer", { message });
            return;
          }
        }
        setReferredBy(referrer);
        setAccountType(accountType);
        if (referrer) toast.success(`Referred by ${referrer.name}`);
        form.reset();
        router.push("/dashboard/signup/verify");
      })}
      onDismissErrors={hasErrors ? () => form.clearErrors() : undefined}
      submitLabel="Sign up"
      isPending={form.formState.isSubmitting}
      isSubmitDisabled={!form.formState.isValid}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/dashboard/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Controller
        control={form.control}
        name="accountType"
        render={({ field }) => (
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-sm">Sign up as</legend>
            <RadioGroup
              inputRef={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 gap-2.5"
            >
              {ACCOUNT_TYPE_OPTIONS.map(({ value, label, hint, icon }) => (
                <label
                  key={value}
                  className="group/option flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 py-2.5 transition-[border-color,box-shadow,background-color] hover:border-primary/30 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-data-checked:border-primary has-data-checked:bg-white has-data-checked:shadow-[0_1px_2px_rgba(18,18,18,0.06)]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary/70 transition-colors group-has-data-checked/option:bg-primary group-has-data-checked/option:text-primary-foreground">
                    <HugeiconsIcon icon={icon} aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                  </span>
                  <RadioGroupItem value={value} className="focus-visible:ring-0" />
                </label>
              ))}
            </RadioGroup>
          </fieldset>
        )}
      />

      <Controller
        control={form.control}
        name="referrer"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            onChange={(code) => {
              // A failed lookup is a manual error, which validation alone won't clear.
              form.clearErrors("referrer");
              field.onChange(code.toUpperCase());
            }}
            id="referrer"
            label="Referral code (optional)"
            placeholder="Code of the person who invited you"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            icon={<HugeiconsIcon icon={UserAdd01Icon} />}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            autoComplete="email"
            icon={<HugeiconsIcon icon={Mail01Icon} />}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            {...field}
            id="password"
            onChange={(password) => {
              field.onChange(password);
              // The confirmation may stop matching, and only this field changed.
              if (form.formState.touchedFields.confirmPassword) form.trigger("confirmPassword");
            }}
            label="Password"
            placeholder="Set your password"
            autoComplete="new-password"
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
            id="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="terms"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-base">
              <Checkbox
                id="terms"
                inputRef={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  // Counts as touched straight away, so unticking explains why the button went grey.
                  field.onBlur();
                }}
                aria-invalid={!!fieldState.error}
                className="size-5 rounded-[5px]"
              />
              <label htmlFor="terms">I agree to</label>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/terms`}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                Term &amp; Condition
              </Link>
            </div>
            {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
          </div>
        )}
      />
    </AuthForm>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell banner={<AuthInvestorsBanner />}>
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
