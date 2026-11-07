"use client";

import { Suspense } from "react";

import { CardMenu } from "@/components/dashboard/card-menu";
import { ProgressRing } from "@/components/primitives/progress-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCircleIcon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { AssetsCard } from "./_assets-card";
import { STATS } from "./_data";
import { TransactionTables } from "./_transaction-tables";

const STAT_MENU_ITEMS = ["Print data", "Reset data", "Download data"];

function StatCard({ title, amount, change, percent }: (typeof STATS)[number]) {
  return (
    <Card className="ring-0">
      <CardHeader className="flex items-center justify-between border-b border-dashed px-5 pb-3">
        <CardTitle className="font-normal">{title}</CardTitle>
        <CardMenu label={title} items={STAT_MENU_ITEMS} />
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 px-5 pb-1">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xl font-semibold tracking-tight">{amount}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <HugeiconsIcon icon={ArrowUp02Icon} aria-hidden className="size-4" />
            {change}
          </p>
        </div>
        <ProgressRing value={percent} />
      </CardContent>
    </Card>
  );
}

export function Client$DashboardPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button
          className="h-10 rounded-full px-4"
          onClick={() => toast.info("Opening an account isn't connected to a backend yet.")}
        >
          <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
          Open an Account
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <AssetsCard />

      {/* DataTable reads the clock while rendering, which can't happen during prerender. */}
      <Suspense fallback={<Skeleton className="h-150 rounded-xl" />}>
        <TransactionTables />
      </Suspense>
    </>
  );
}
