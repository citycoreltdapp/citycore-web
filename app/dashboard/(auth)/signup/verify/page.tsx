import { OtpForm } from "../../_otp-form";
import { AuthInvestorsBanner, AuthShell } from "../../_shared";

export default function SignUpVerifyPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthInvestorsBanner />} backHref="/dashboard/signup">
      <OtpForm flow="verify-email" nextHref="/dashboard/signup/verified" startHref="/dashboard/signup" />
    </AuthShell>
  );
}
