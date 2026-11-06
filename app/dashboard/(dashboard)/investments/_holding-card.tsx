import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { INVESTMENTS, naira } from "../marketplace/_data";
import type { Holding } from "./_data";

export const investmentOf = (holding: Holding) =>
  INVESTMENTS.find((investment) => investment.id === holding.investmentId)!;

export const formatMaturity = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function HoldingCard({ holding, index }: { holding: Holding; index: number }) {
  const investment = investmentOf(holding);

  return (
    <Card
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative animate-in gap-0 rounded-2xl px-1.5 py-1.5 ring-foreground/8 transition-[box-shadow,translate] duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:shadow-lg hover:ring-foreground/15 motion-safe:hover:-translate-y-0.5 motion-reduce:animate-none"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-[0.625rem] bg-muted">
        <Image
          src={`/assets/images/marketplace/${investment.image}.png`}
          alt={`Architectural illustration of ${investment.name}`}
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/80 via-black/35 to-transparent" />

        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white capitalize backdrop-blur-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {holding.status}
        </span>
        <span
          aria-hidden
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
        </span>

        <p className="absolute right-3 bottom-2.5 left-3 text-white">
          <span className="block text-xs text-white/80">Current value</span>
          <span className="text-3xl font-light tabular-nums">{naira(holding.principal + holding.accruedYield)}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-2.5 pt-3.5 pb-2.5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            {/* The ::after stretches this link over the whole card. */}
            <Link
              href={`/marketplace/${investment.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {investment.name}
            </Link>
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-3.5 shrink-0" />
            {investment.location}
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-2 border-t border-border pt-3.5">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Principal</dt>
            <dd className="text-sm font-semibold tabular-nums">{naira(holding.principal)}</dd>
          </div>
          <div className="space-y-0.5 text-right">
            <dt className="text-xs text-muted-foreground">Accrued yield</dt>
            <dd className="text-sm font-semibold tabular-nums">{naira(holding.accruedYield)}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <Progress
            aria-label={`${investment.name} tenure`}
            value={(holding.elapsedMonths / holding.tenure) * 100}
            className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-accent"
          />
          <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>
              {holding.elapsedMonths} of {holding.tenure} months
            </span>
            <span>Matures {formatMaturity(holding.maturityDate)}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
