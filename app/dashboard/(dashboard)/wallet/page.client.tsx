"use client";

import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { DEPOSIT_AMOUNT_ID, FundingSection } from "./_funding-cards";
import { AccountBalanceCard, TransferStatCard } from "./_overview-cards";
import { RecentPaymentsCard } from "./_recent-payments-card";

export function Client$WalletPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Wallet Overview</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            className="h-10 rounded-full px-4"
            render={<Link href="/withdrawals" />}
          >
            Withdraw
          </Button>
          <Button
            className="h-10 rounded-full px-4"
            onClick={() => document.getElementById(DEPOSIT_AMOUNT_ID)?.focus()}
          >
            <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
            Fund Wallet
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <AccountBalanceCard />
        <TransferStatCard />
      </div>

      <FundingSection />

      {/* DataTable reads the clock while rendering, which can't happen during prerender. */}
      <Suspense fallback={<Skeleton className="h-150 rounded-2xl" />}>
        <RecentPaymentsCard />
      </Suspense>
    </>
  );
}
