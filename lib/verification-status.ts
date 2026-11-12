"use client";

import { useCurrentUser } from "@/actions/auth";
import { useKycState } from "@/actions/kyc";
import type { KycStatus } from "@/constant/onboarding";

const STATUS = {
  not_started: "notStarted",
  draft: "notStarted",
  in_review: "pending",
  approved: "verified",
  rejected: "actionRequired",
} as const satisfies Record<string, KycStatus>;

export function useKycStatus(): KycStatus | null {
  const { data: user } = useCurrentUser();
  const { data: kyc } = useKycState();
  if (user?.kycCompleted) return "verified";
  return kyc ? STATUS[kyc.status] : null;
}
