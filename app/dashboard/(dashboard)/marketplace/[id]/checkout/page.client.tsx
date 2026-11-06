"use client";

import { useState } from "react";

import { Stepper } from "@/components/primitives/stepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { type Investment, estimateInvestment, naira, validUnits } from "../../_data";
import { InvestmentPanel } from "../../_investment-parts";
import { AgreementForm } from "./_agreement-form";
import { OrderSummary } from "./_order-summary";

const STEPS = [{ title: "Property" }, { title: "Agreement" }, { title: "Confirmation" }];
const NEXT_STEPS = [
  "Receive your purchase reference.",
  "Download the signed agreement and receipt.",
  "Track the allocation in My Investments.",
];

// The form above it collapses on confirm, so bring the result into view. Stable, so it only runs when mounted.
const revealResult = (element: HTMLElement | null) => element?.scrollIntoView({ block: "center", behavior: "smooth" });

export function Client$InvestmentCheckoutPage({ investment }: { investment: Investment }) {
  const searchParams = useSearchParams();
  const units = Number(searchParams.get("units") ?? "2");
  const isValid = validUnits(investment, units);
  const estimate = estimateInvestment(investment, isValid ? units : 0);
  const [confirmed, setConfirmed] = useState(false);
  const changeHref = `/marketplace/${investment.id}${isValid ? `?units=${units}` : ""}`;

  if (!isValid)
    return (
      <InvestmentPanel title="Choose your investment units">
        <p>The number of units in this checkout is invalid or exceeds availability.</p>
        <Button className="self-start rounded-full" render={<Link href={changeHref} />} nativeButton={false}>
          Return to investment
        </Button>
      </InvestmentPanel>
    );

  return (
    <>
      <Link
        href={changeHref}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        {investment.name}
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout & Investor Agreement</h1>
        <p className="text-sm text-muted-foreground tabular-nums">
          {investment.name} · {units} {units === 1 ? "unit" : "units"} · {naira(estimate.principal)}
        </p>
      </header>

      <Stepper steps={STEPS} currentStep={confirmed ? 2 : 1} />

      {/* On phones the summary follows the form, so the signing button comes after the consents it depends on. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]">
        {confirmed ? (
          <Card
            ref={revealResult}
            role="status"
            className="min-w-0 items-start gap-4 rounded-2xl p-6 ring-foreground/8 md:p-8"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-success text-white">
              <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-5" />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-light">Illustrative review complete</h2>
              <p className="max-w-prose text-sm/6 text-muted-foreground">
                Your {units}-unit selection has been reviewed. No purchase, signature or wallet debit has been recorded.
                Live purchases will be available when the backend is connected.
              </p>
            </div>
            <Button className="h-10 rounded-full px-5" render={<Link href="/marketplace" />} nativeButton={false}>
              Back to marketplace
            </Button>
          </Card>
        ) : (
          <AgreementForm
            investment={investment}
            estimate={estimate}
            onConfirm={() => {
              if (estimate.balanceAfter >= 0) setConfirmed(true);
            }}
          />
        )}

        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <OrderSummary
            investment={investment}
            units={units}
            estimate={estimate}
            confirmed={confirmed}
            changeHref={changeHref}
          />
        </aside>

        <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
          <h2 className="text-base font-semibold">After you confirm</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm/5 text-muted-foreground sm:flex-col sm:gap-2">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums"
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
