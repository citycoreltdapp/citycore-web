"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

import { AuthInvestorsBanner, AuthShell, AuthSuccess } from "../../_shared";

function AutoRedirect({ href, delayMs = 2500 }: { href: string; delayMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => router.replace(href), delayMs);

    return () => clearTimeout(timer);
  }, [router, href, delayMs]);

  return <Spinner aria-label="Redirecting" className="size-6 text-primary/60" />;
}

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
