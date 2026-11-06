import { OtpForm } from "../../_otp-form";
import { AuthQuoteBanner, AuthShell } from "../../_shared";

export default function ForgotPasswordVerifyPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthQuoteBanner />} backHref="/forgot-password">
      <OtpForm nextHref="/reset-password" />
    </AuthShell>
  );
}
