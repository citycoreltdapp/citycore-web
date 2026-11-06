import { AutoRedirect } from "../../_auto-redirect";
import { AuthInvestorsBanner, AuthShell, AuthSuccess } from "../../_shared";

const NEXT_STEP = "/onboarding";

export default function SignUpVerifiedPage() {
  return (
    <AuthShell imageSide="right" banner={<AuthInvestorsBanner />}>
      <div className="flex w-full max-w-[535px] flex-col">
        <AuthSuccess
          title="OTP Verified successfully"
          subtitle="Let’s start your journey"
          actionHref={NEXT_STEP}
          actionLabel="Continue to Onboarding"
        />
        <div className="mt-16 flex justify-end">
          <AutoRedirect href={NEXT_STEP} />
        </div>
      </div>
    </AuthShell>
  );
}
