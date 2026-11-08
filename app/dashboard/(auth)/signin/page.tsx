"use client";

import { PasswordField } from "@/components/primitives/password-field";
import { TextField } from "@/components/primitives/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { type SignInFormData, signInSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthForm, AuthShell } from "../_shared";

export default function SignInPage() {
  const router = useRouter();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: false },
    // The submit button stays disabled until the form is valid, so errors show as each field is left.
    mode: "onTouched",
  });

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <AuthShell>
      <AuthForm
        title="Welcome Back"
        subtitle="Sign in to your account"
        // ponytail: no backend yet, so any valid input signs in. Call the sign-in API here and use
        // form.setError("password", { message: "Password is incorrect" }) for a wrong password.
        // Everyone goes through KYC for now. The API will say who has already done it, and they should go to "/".
        onSubmit={form.handleSubmit(() => {
          form.reset();
          router.push("/dashboard/onboarding");
        })}
        onGoogle={() => toast.info("Google sign-in isn't connected to a backend yet.")}
        onDismissErrors={hasErrors ? () => form.clearErrors() : undefined}
        submitLabel="Sign in"
        isPending={form.formState.isSubmitting}
        isSubmitDisabled={!form.formState.isValid}
        footer={
          <>
            Don’t have an account?{" "}
            <Link href="/dashboard/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </>
        }
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

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              {...field}
              id="password"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={fieldState.error?.message}
            />
          )}
        />

        <div className="flex items-center justify-between gap-3 text-base">
          <Controller
            control={form.control}
            name="remember"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  inputRef={field.ref}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-5 rounded-[5px]"
                />
                <label htmlFor="remember">Remember me</label>
              </div>
            )}
          />
          <Link href="/dashboard/forgot-password" className="font-medium text-primary hover:underline">
            Forgot Password
          </Link>
        </div>
      </AuthForm>
    </AuthShell>
  );
}
