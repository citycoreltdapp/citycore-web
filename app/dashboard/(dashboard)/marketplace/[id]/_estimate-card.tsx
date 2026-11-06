"use client";

import { useState } from "react";

import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight02Icon, MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  type Investment,
  WALLET_BALANCE,
  availableUnits,
  estimateInvestment,
  initialUnits,
  naira,
  validUnits,
} from "../_data";
import { SummaryRow } from "../_investment-parts";

export function EstimateCard({ investment }: { investment: Investment }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [units, setUnits] = useState<number | undefined>(() => initialUnits(investment, searchParams.get("units")));
  const available = availableUnits(investment);
  const isValid = units !== undefined && validUnits(investment, units);
  const estimate = estimateInvestment(investment, isValid ? units : 0);
  const canAfford = estimate.balanceAfter >= 0;
  const updateUnits = (next: number | undefined) => {
    setUnits(next);
    if (next !== undefined && validUnits(investment, next)) {
      const query = new URLSearchParams(searchParams.toString());
      query.set("units", String(next));
      window.history.replaceState(null, "", `?${query.toString()}`);
    }
  };

  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">Estimate your return</h2>
          <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {available.toLocaleString("en-NG")} units left
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Remove one unit"
            className="mt-7 size-9 shrink-0 rounded-full"
            disabled={!isValid || units <= 1}
            onClick={() => updateUnits((units ?? 2) - 1)}
          >
            <HugeiconsIcon icon={MinusSignIcon} aria-hidden />
          </Button>
          <NumberField
            id="investment-units"
            label="Units"
            value={units}
            onChange={updateUnits}
            min={1}
            max={available}
            className="min-w-0 flex-1"
            labelClassName="justify-center"
            inputClassName="text-center text-base font-semibold tabular-nums"
            error={!isValid ? `Choose 1–${available.toLocaleString("en-NG")} whole units.` : undefined}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Add one unit"
            className="mt-7 size-9 shrink-0 rounded-full"
            disabled={!isValid || units >= available}
            onClick={() => updateUnits((units ?? 0) + 1)}
          >
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
          </Button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Projected at maturity</p>
          <p className="mt-1 text-3xl font-light tabular-nums">{naira(estimate.maturity)}</p>
        </div>

        <dl className="space-y-2.5 border-t border-border pt-4">
          <SummaryRow label="Principal" value={naira(estimate.principal)} />
          <SummaryRow label="Purchase fee" value={naira(0)} />
          <SummaryRow label={`Projected return, ${investment.tenure} months`} value={naira(estimate.projectedReturn)} />
        </dl>

        <p className="text-xs/5 text-muted-foreground tabular-nums">
          {naira(estimate.principal)} × {investment.annualRoi}% × {investment.tenure}/12 ={" "}
          {naira(estimate.projectedReturn)}. Simple interest; no compounding. Before any applicable tax or exit costs.
          Actual results may differ. This is a target, not a guaranteed return or financial advice.
        </p>

        {!canAfford && (
          <p role="alert" className="text-xs text-destructive">
            Your illustrative wallet balance is insufficient. Fund your wallet to continue.
          </p>
        )}

        <Button
          className="h-11 w-full rounded-full"
          disabled={!isValid || !canAfford}
          onClick={() => router.push(`/marketplace/${investment.id}/checkout?units=${units}`)}
        >
          Continue with {isValid ? units : 0} {units === 1 ? "unit" : "units"}
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-5">
        <dl className="space-y-2.5">
          <SummaryRow label="Wallet now" value={naira(WALLET_BALANCE)} />
          <SummaryRow label="After purchase" value={naira(estimate.balanceAfter)} />
        </dl>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link href="/wallet" className="font-semibold underline-offset-4 hover:underline">
            Fund wallet
          </Link>
          <button
            type="button"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => toast.info("City Core support isn't connected yet.")}
          >
            Ask support
          </button>
        </div>
      </div>
    </Card>
  );
}
