"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import type { Investment } from "../_data";
import { EstimateCard } from "./_estimate-card";
import { PropertyDetails, PropertyHero } from "./_property-details";

export function Client$InvestmentPage({ investment }: { investment: Investment }) {
  return (
    <>
      <Link
        href="/marketplace"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        Marketplace
      </Link>

      {/* On phones the estimate follows the hero, so nobody scrolls past the details to reach it. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PropertyHero investment={investment} />
        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <EstimateCard investment={investment} />
        </aside>
        <PropertyDetails investment={investment} />
      </div>
    </>
  );
}
