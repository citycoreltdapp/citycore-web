import { OtpForm } from "../../_otp-form";
import { AuthInvestorsBanner, AuthShell } from "../../_shared";

export default function SignUpVerifyPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthInvestorsBanner />} backHref="/signup">
      <OtpForm nextHref="/signup/verified" />
    </AuthShell>
  );
}
