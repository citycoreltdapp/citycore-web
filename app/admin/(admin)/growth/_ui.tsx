"use client";

import { TextAreaField, TextField } from "@/components/primitives/text-field";
import type { GrowthDraft } from "@/constant/schemas/admin-growth";

import { StatusPill } from "../account/_ui";

export type Status = "incentiveStatus" | "promoStatus" | "broadcastStatus" | "smsStatus";
export type Draft = {
  draft: GrowthDraft;
  update: (key: keyof GrowthDraft, value: string | boolean) => void;
  persist: (status?: Status) => void;
  ready: boolean;
};

export const FOOTER = "Target returns are not guaranteed. Capital is at risk. Unsubscribe · Privacy";
export const AUDIENCE = { segment: 420, suppressed: 108, eligible: 312 };

export function DraftField({
  ctx,
  name,
  label,
  multiline = false,
  className,
}: {
  ctx: Draft;
  name: keyof GrowthDraft;
  label: string;
  multiline?: boolean;
  className?: string;
}) {
  const Component = multiline ? TextAreaField : TextField;
  return (
    <Component
      id={`growth-${name}`}
      label={label}
      value={String(ctx.draft[name])}
      onChange={(value) => ctx.update(name, value)}
      maxLength={name === "sms" ? 160 : 2000}
      className={className}
    />
  );
}

export function ApprovalPill({ status }: { status: "draft" | "pending" }) {
  return status === "pending" ? (
    <StatusPill tone="warning">Awaiting approval</StatusPill>
  ) : (
    <StatusPill tone="muted">Draft</StatusPill>
  );
}
