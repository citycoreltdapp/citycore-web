"use client";

import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminInvestor } from "@/constant/schemas/admin-people";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";

import { ROLE_ITEMS } from "../_operations/data";
import { money } from "../account/_data";
import { SegmentBar, StatusPill, formatDate } from "../account/_ui";

export const ACCOUNT_TONES = { active: "success", suspended: "warning", blacklisted: "danger" } as const;
export const KYC_TONES = { approved: "success", pending: "muted", escalated: "warning", rejected: "danger" } as const;
export const ACCESS_TONES = { active: "success", blocked: "warning", revoked: "danger" } as const;

export const roleLabel = (role: string) => ROLE_ITEMS.find((item) => item.value === role)?.label ?? role;
export const portfolio = (investor: AdminInvestor) => investor.principal + investor.yield;

export function Initials({
  name,
  size = "default",
  className,
}: {
  name: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const letters = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className="bg-accent/20 text-xs font-semibold text-foreground">{letters}</AvatarFallback>
    </Avatar>
  );
}

export function PersonCell({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Initials name={name} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs">{detail}</p>
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
      {children}
    </Link>
  );
}

/** Label and value rows separated by hairlines. */
export function DetailList({ rows, className }: { rows: [string, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("flex flex-col text-sm", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-border py-3 last:border-none">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="truncate text-right font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Quick look at an investor from a table row. The full profile lives on the management page. */
export function InvestorSheet({ investor, onClose }: { investor: AdminInvestor | null; onClose: () => void }) {
  return (
    <Sheet open={!!investor} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {investor && (
          <>
            <SheetHeader className="gap-1 border-b border-border p-6">
              <Initials name={investor.name} size="lg" className="mb-3 size-12" />
              <SheetTitle className="text-base font-semibold">{investor.name}</SheetTitle>
              <SheetDescription>
                {investor.id} · {investor.email}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusPill tone={ACCOUNT_TONES[investor.status]}>{investor.status}</StatusPill>
                <StatusPill tone={KYC_TONES[investor.kycStatus]}>KYC {investor.kycStatus}</StatusPill>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-3 p-6">
              <p className="text-xs text-muted-foreground">Portfolio value</p>
              <p className="text-3xl font-light tabular-nums">{money(portfolio(investor))}</p>
              <SegmentBar
                className="bg-muted"
                parts={[
                  { key: "principal", value: investor.principal, className: "bg-foreground" },
                  { key: "yield", value: investor.yield, className: "bg-accent" },
                ]}
              />
              <DetailList
                rows={[
                  ["Principal", money(investor.principal)],
                  ["Accrued yield", money(investor.yield)],
                  ["Wallet", money(investor.wallet)],
                  ["Holdings", `${investor.units} units · ${investor.investmentCount} investments`],
                  ["KYC tier", `Tier ${investor.tier}`],
                  ["Phone", investor.phone],
                  ["Joined", formatDate(investor.joinedAt)],
                ]}
              />
            </div>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-border p-6">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                nativeButton={false}
                render={<Link href={`/kyc/review?investor=${encodeURIComponent(investor.id)}`} />}
              >
                KYC case
              </Button>
              <Button
                className="flex-1 rounded-full"
                nativeButton={false}
                render={<Link href={`/users/management?investor=${encodeURIComponent(investor.id)}`} />}
              >
                Open profile
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
