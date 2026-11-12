import { OtpForm } from "../../_otp-form";
import { AuthQuoteBanner, AuthShell } from "../../_shared";

export default function ForgotPasswordVerifyPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthQuoteBanner />} backHref="/dashboard/forgot-password">
      <OtpForm flow="reset-password" nextHref="/dashboard/reset-password" startHref="/dashboard/forgot-password" />
    </AuthShell>
  );
}
