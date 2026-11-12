"use client";

import { authFlow, useResetPassword } from "@/actions/auth";
import { PasswordField } from "@/components/primitives/password-field";
import { toast } from "@/components/ui/toast";
import { type ResetPasswordFormData, resetPasswordSchema } from "@/constant/auth";
import { fieldErrors } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AuthForm, AuthQuoteBanner, AuthShell } from "../_shared";

export default function ResetPasswordPage() {
  const router = useRouter();
  const resetPassword = useResetPassword();

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
        onSubmit={form.handleSubmit(({ password }) => {
          const { email, code } = authFlow.get();
          if (!email || !code) {
            toast.add({ type: "warning", title: "Start again", description: "Your reset code has expired." });
            router.replace("/dashboard/forgot-password");
            return;
          }
          resetPassword.mutate(
            { email, code, newPassword: password },
            {
              onSuccess: () => {
                authFlow.clear();
                form.reset();
                router.push("/dashboard/reset-password/success");
              },
              onError: (error) => {
                const fields = fieldErrors(error);
                if (fields.newPassword) form.setError("password", { message: fields.newPassword });
                else toast.add({ type: "error", title: "Couldn't reset your password", description: error.message });
              },
            }
          );
        })}
        submitLabel="Save New Password"
        isPending={resetPassword.isPending}
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
