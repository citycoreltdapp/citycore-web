"use client";

import { Suspense } from "react";

import { accountTypeSchema } from "@/constant/auth";
import { useAccountType } from "@/lib/account-type";
import { useSearchParams } from "next/navigation";

import { CorporateOnboarding } from "./_corporate";
import { IndividualOnboarding } from "./_individual";

function OnboardingFlow() {
  const savedType = useAccountType();
  // `?as=corporate` previews a flow without signing up again.
  const previewType = accountTypeSchema.safeParse(useSearchParams().get("as")).data;
  const accountType = previewType ?? savedType;

  if (accountType === null) return null;
  return accountType === "corporate" ? <CorporateOnboarding /> : <IndividualOnboarding />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
