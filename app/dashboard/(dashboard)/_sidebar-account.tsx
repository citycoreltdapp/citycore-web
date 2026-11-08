"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { KycStatus } from "@/constant/onboarding";
import { useKycStatus } from "@/lib/verification-status";
import { ArrowRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";

import { PROFILE } from "./_data";

const STATUS = {
  notStarted: {
    label: "Not verified",
    dot: "bg-destructive",
    href: "/dashboard/onboarding",
    cta: "Verify your identity · 3 steps",
  },
  pending: { label: "Verification in review", dot: "bg-warning", href: null, cta: null },
  actionRequired: { label: "Needs attention", dot: "bg-warning", href: "/dashboard/onboarding", cta: "Review and resubmit" },
  verified: { label: "Verified investor", dot: "bg-success", href: null, cta: null },
} as const satisfies Record<KycStatus, unknown>;

/** The investor's account at the foot of the sidebar: who's signed in, their KYC status, and log out. */
export function SidebarAccount() {
  const status = useKycStatus();
  const meta = status ? STATUS[status] : null;

  return (
    <div className="flex flex-col gap-2">
      {meta?.href && (
        <Link
          href={meta.href}
          className="group flex items-center justify-between gap-2 rounded-xl bg-[#121212] px-3.5 py-3 text-white transition-colors outline-none hover:bg-[#1c1c1c] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Unlock investing</span>
            <span className="block text-xs text-white/60">{meta.cta}</span>
          </span>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-0.5">
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
          </span>
        </Link>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
        <Avatar className="size-9">
          <AvatarImage src="/assets/images/investors/investor-avatar-02.jpg" alt="" />
          <AvatarFallback>{PROFILE.firstName[0]}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {PROFILE.firstName} {PROFILE.lastName}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full bg-muted-foreground/40", meta?.dot)} />
            <span className="truncate">{meta?.label ?? "Investor"}</span>
          </span>
        </span>
        {/* ponytail: no sessions yet, so this only goes to sign-in. Sign out through the API here. */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          nativeButton={false}
          render={<Link href="/dashboard/signin" />}
          className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
