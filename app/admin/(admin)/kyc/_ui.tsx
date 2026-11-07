"use client";

import type { KycCase } from "@/constant/schemas/admin-people";
import { CancelCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

import { KYC_CASES } from "../_operations/data";
import { AS_OF } from "../account/_data";

export const caseFor = (investorId: string) => KYC_CASES.find((c) => c.investorId === investorId);
export const reviewHref = (investorId: string) => `/kyc/review?investor=${encodeURIComponent(investorId)}`;

/** Days since submission, counted against the fixed preview date so server and browser agree. */
export function ageLabel(iso: string) {
  const days = Math.round((Date.parse(AS_OF) - Date.parse(iso.slice(0, 10))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export const FACE_MATCH_THRESHOLD = 90;

export function CheckMark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", ok ? "text-success" : "text-destructive")}>
      <HugeiconsIcon icon={ok ? CheckmarkCircle02Icon : CancelCircleIcon} aria-hidden className="size-3.5" />
      <span className={ok ? "text-muted-foreground" : "font-semibold"}>{label}</span>
      <span className="sr-only">{ok ? "matched" : "failed"}</span>
    </span>
  );
}

export function ChecksSummary({ record }: { record: KycCase }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <CheckMark ok={record.bvnMatch} label="BVN" />
      <CheckMark ok={record.ninMatch} label="NIN" />
      <CheckMark ok={record.faceMatch >= FACE_MATCH_THRESHOLD} label={`Face ${record.faceMatch}%`} />
    </span>
  );
}
