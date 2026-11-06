import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

import { type Investment, WALLET_BALANCE, type estimateInvestment, naira } from "../../_data";
import { SummaryRow } from "../../_investment-parts";
import { AGREEMENT_FORM_ID } from "./_agreement-form";

export function OrderSummary({
  investment,
  units,
  estimate,
  confirmed,
  changeHref,
}: {
  investment: Investment;
  units: number;
  estimate: ReturnType<typeof estimateInvestment>;
  confirmed: boolean;
  changeHref: string;
}) {
  const canAfford = estimate.balanceAfter >= 0;

  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={`/assets/images/marketplace/${investment.image}.png`}
              alt={`Architectural illustration of ${investment.name}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{investment.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{investment.location}</p>
          </div>
          {!confirmed && (
            <Link href={changeHref} className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline">
              Change
            </Link>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">Total wallet debit</p>
          <p className="mt-1 text-3xl font-light tabular-nums">{naira(estimate.principal)}</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {units} {units === 1 ? "unit" : "units"} × {naira(investment.unitPrice)} · {naira(0)} purchase fee
          </p>
        </div>

        <dl className="space-y-2.5 border-t border-border pt-4">
          <SummaryRow label={`Projected return, ${investment.tenure} months`} value={naira(estimate.projectedReturn)} />
          <SummaryRow label="Projected maturity" value={naira(estimate.maturity)} />
        </dl>

        <p className="rounded-lg bg-warning/15 p-3 text-xs/5 text-warning">
          Target, not guaranteed. Estimate assumes the full {investment.tenure}-month term, simple interest and no
          compounding, before applicable taxes.
        </p>

        {!canAfford && (
          <p role="alert" className="text-xs text-destructive">
            Insufficient wallet balance. Fund your wallet or choose fewer units.
          </p>
        )}

        <div className="space-y-2.5">
          <Button
            type="submit"
            form={AGREEMENT_FORM_ID}
            className="h-11 w-full rounded-full"
            disabled={confirmed || !canAfford}
          >
            {confirmed ? "Review complete" : `Sign & confirm ${naira(estimate.principal)}`}
          </Button>
          <p className="text-center text-xs/5 text-muted-foreground">
            Illustrative confirmation. No purchase or wallet debit occurs here.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold">City Core NGN wallet</p>
          <Link href="/wallet" className="underline-offset-4 hover:underline">
            Fund wallet
          </Link>
        </div>
        <dl className="space-y-2.5">
          <SummaryRow label="Balance before" value={naira(WALLET_BALANCE)} />
          <SummaryRow label="Balance after" value={naira(estimate.balanceAfter)} />
        </dl>
      </div>
    </Card>
  );
}
