"use client";

import * as React from "react";

import {
  authFlow,
  useCheckResetCode,
  useForgotPassword,
  useRequestEmailVerification,
  useResendLoginCode,
  useVerifyEmail,
  useVerifyLogin,
} from "@/actions/auth";
import { OtpField } from "@/components/primitives/otp-field";
import { toast } from "@/components/ui/toast";
import { type OtpFormData, otpSchema } from "@/constant/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { AuthForm } from "./_shared";

const RESEND_SECONDS = 59;

/**
 * The code step shared by sign-up and password reset. Goes to `nextHref` once the code is accepted, or back to
 * `startHref` when there's no email to check it against.
 */
export function OtpForm({
  flow,
  nextHref,
  startHref,
}: {
  flow: "verify-email" | "reset-password" | "sign-in";
  nextHref: string;
  startHref: string;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);
  const verifyEmail = useVerifyEmail();
  const checkResetCode = useCheckResetCode();
  const requestVerification = useRequestEmailVerification();
  const forgotPassword = useForgotPassword();
  const verifyLogin = useVerifyLogin();
  const resendLoginCode = useResendLoginCode();
  const check = { "verify-email": verifyEmail, "reset-password": checkResetCode, "sign-in": verifyLogin }[flow];
  const resend = { "verify-email": requestVerification, "reset-password": forgotPassword, "sign-in": resendLoginCode }[
    flow
  ];

  const redirected = React.useRef(false);
  React.useEffect(() => {
    if (authFlow.get().email || redirected.current) return;
    redirected.current = true;
    toast.add({ type: "warning", title: "Start again", description: "Enter your email first so we can send a code." });
    router.replace(startHref);
  }, [router, startHref]);

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
    const { email } = authFlow.get();
    if (!email) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: "Code sent", description: "Check your inbox for a new code." });
          form.reset();
          setSecondsLeft(RESEND_SECONDS);
        },
        onError: (error) => toast.add({ type: "error", title: "Couldn't send a code", description: error.message }),
      }
    );
  };

  const submit = ({ code }: OtpFormData) => {
    const { email } = authFlow.get();
    if (!email) return;
    check.mutate(
      { email, code },
      {
        onSuccess: () => {
          if (flow === "reset-password") authFlow.set({ email, code });
          else authFlow.clear();
          const next = new URLSearchParams(window.location.search).get("next");
          const safeNext = next?.startsWith("/dashboard") && !next.startsWith("//") ? next : null;
          router.push(flow === "sign-in" ? (safeNext ?? nextHref) : nextHref);
        },
        onError: (error) => {
          if (error.code === "INVALID_CODE" || error.code === "VALIDATION_ERROR")
            form.setError("code", { message: error.message });
          else toast.add({ type: "error", title: "Couldn't check the code", description: error.message });
        },
      }
    );
  };

  return (
    <AuthForm
      icon={<HugeiconsIcon icon={Mail01Icon} />}
      title={flow === "sign-in" ? "Check your email" : "OTP Verification"}
      subtitle={
        flow === "sign-in"
          ? "Enter the 6-digit code we sent you to finish signing in"
          : "Check your email to see the verification code"
      }
      onSubmit={form.handleSubmit(submit)}
      submitLabel="Verify"
      isPending={check.isPending}
      isSubmitDisabled={!form.formState.isValid}
      footer={
        secondsLeft > 0 ? (
          <>
            Resend code in <span className="font-medium text-primary">00:{String(secondsLeft).padStart(2, "0")}</span>
          </>
        ) : (
          <>
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={resendCode}
              disabled={resend.isPending}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
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
