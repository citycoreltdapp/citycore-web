"use client";

import { Suspense } from "react";

import { FieldError } from "@/components/primitives/field";
import { PasswordField } from "@/components/primitives/password-field";
import { TextField } from "@/components/primitives/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { type SignUpFormData, signUpSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthForm, AuthInvestorsBanner, AuthShell } from "../_shared";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      referrer: searchParams.get("ref") ?? "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    // The submit button stays disabled until the form is valid, so errors show as each field is left.
    mode: "onTouched",
  });

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <AuthForm
      title="Get Started Now"
      subtitle="Let’s create your account"
      // ponytail: no backend yet, call the sign-up API here and use
      // form.setError("email", { message: "Email is already taken. Please enter another email." }) for a taken email.
      onSubmit={form.handleSubmit(() => {
        form.reset();
        router.push("/signup/verify");
      })}
      onGoogle={() => toast.info("Google sign-up isn't connected to a backend yet.")}
      onDismissErrors={hasErrors ? () => form.clearErrors() : undefined}
      submitLabel="Sign up"
      isPending={form.formState.isSubmitting}
      isSubmitDisabled={!form.formState.isValid}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Controller
        control={form.control}
        name="referrer"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="referrer"
            label="Referrer"
            placeholder="Referrer ID"
            autoComplete="off"
            icon={<HugeiconsIcon icon={UserIcon} />}
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
