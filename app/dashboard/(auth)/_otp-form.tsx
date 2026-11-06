"use client";

import * as React from "react";

import { OtpField } from "@/components/primitives/otp-field";
import { type OtpFormData, otpSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthForm } from "./_shared";

const RESEND_SECONDS = 59;

/** The code step shared by sign-up and password reset. Goes to `nextHref` once the code is accepted. */
export function OtpForm({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
    // The submit button stays disabled until the form is valid, so errors show as each field is left.
    mode: "onTouched",
  });

  React.useEffect(() => {
    if (secondsLeft === 0) return;

    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resendCode = () => {
    // ponytail: no backend yet, call the resend API here.
    toast.info("Resending codes isn't connected to a backend yet.");
    form.reset();
    setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <AuthForm
      icon={<HugeiconsIcon icon={Mail01Icon} />}
      title="OTP Verification"
      subtitle="Check your email to see the verification code"
      // ponytail: no backend yet, so any 6 digits pass. Verify the code here and use form.setError for a wrong one.
      onSubmit={form.handleSubmit(() => router.push(nextHref))}
      submitLabel="Verify"
      isPending={form.formState.isSubmitting}
      isSubmitDisabled={!form.formState.isValid}
      footer={
        secondsLeft > 0 ? (
          <>
            Resend code in <span className="font-medium text-primary">00:{String(secondsLeft).padStart(2, "0")}</span>
          </>
        ) : (
          <>
            Didn&apos;t receive the code?{" "}
            <button type="button" onClick={resendCode} className="font-medium text-primary hover:underline">
              Resend code
            </button>
          </>
        )
      }
    >
      <Controller
        control={form.control}
        name="code"
        render={({ field, fieldState }) => <OtpField {...field} id="code" error={fieldState.error?.message} />}
      />
    </AuthForm>
  );
}
