import { AuthQuoteBanner, AuthShell, AuthSuccess } from "../../_shared";

export default function ResetPasswordSuccessPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthQuoteBanner />}>
      <AuthSuccess
        title="Your Password Successfully Changed"
        subtitle="Sign in to your account with your new password"
        actionHref="/dashboard/signin"
        actionLabel="Sign in"
      />
    </AuthShell>
  );
}
