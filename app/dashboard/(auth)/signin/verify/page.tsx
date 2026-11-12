import { OtpForm } from "../../_otp-form";
import { AuthShell } from "../../_shared";

export default function SignInVerifyPage() {
  return (
    <AuthShell imageSide="right" backHref="/dashboard/signin">
      <OtpForm flow="sign-in" nextHref="/dashboard" startHref="/dashboard/signin" />
    </AuthShell>
  );
}
