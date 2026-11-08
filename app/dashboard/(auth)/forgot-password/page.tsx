"use client";

import { TextField } from "@/components/primitives/text-field";
import { type ForgotPasswordFormData, forgotPasswordSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AuthForm, AuthQuoteBanner, AuthShell } from "../_shared";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    // The submit button stays disabled until the form is valid, so errors show as each field is left.
    mode: "onTouched",
  });

  return (
    <AuthShell imageSide="right" banner={<AuthQuoteBanner />} backHref="/dashboard/signin">
      <AuthForm
        icon={<HugeiconsIcon icon={SquareLock02Icon} />}
        title="Forgot Password?"
        subtitle="Enter your email to reset your password"
        // ponytail: no backend yet, call the forgot-password API here.
        onSubmit={form.handleSubmit(() => router.push("/dashboard/forgot-password/verify"))}
        submitLabel="Submit"
        isPending={form.formState.isSubmitting}
        isSubmitDisabled={!form.formState.isValid}
      >
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
      </AuthForm>
    </AuthShell>
  );
}
