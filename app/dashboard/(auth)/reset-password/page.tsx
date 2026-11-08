"use client";

import { PasswordField } from "@/components/primitives/password-field";
import { type ResetPasswordFormData, resetPasswordSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AuthForm, AuthQuoteBanner, AuthShell } from "../_shared";

export default function ResetPasswordPage() {
  const router = useRouter();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    // The submit button stays disabled until the form is valid, so errors show as each field is left.
    mode: "onTouched",
  });

  return (
    <AuthShell imageSide="right" banner={<AuthQuoteBanner />}>
      <AuthForm
        icon={<HugeiconsIcon icon={SquareLock02Icon} />}
        title="Set New Password"
        subtitle="Enter your new password to complete the reset process"
        // ponytail: no backend yet, call the reset-password API here.
        onSubmit={form.handleSubmit(() => {
          form.reset();
          router.push("/dashboard/reset-password/success");
        })}
        submitLabel="Save New Password"
        isPending={form.formState.isSubmitting}
        isSubmitDisabled={!form.formState.isValid}
        footer={
          <>
            Remember old password?{" "}
            <Link href="/dashboard/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
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
              label="New Password"
              placeholder="Enter new password"
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
              label="Confirm New Password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              error={fieldState.error?.message}
            />
          )}
        />
      </AuthForm>
    </AuthShell>
  );
}
