"use client";

import { useCurrentUser } from "@/actions/auth";

import { CorporateOnboarding } from "./_corporate";
import { IndividualOnboarding } from "./_individual";

export default function OnboardingPage() {
  const { data: user } = useCurrentUser();

  if (!user) return null;
  return user.accountType === "corporate" ? <CorporateOnboarding /> : <IndividualOnboarding />;
}
