import { Card } from "@/components/ui/card";
import { ArrowUpRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { type Investment, naira } from "./_data";
import { Allocation } from "./_investment-parts";

export function InvestmentCard({
  investment,
  index,
  href = `/marketplace/${investment.id}`,
  statusLabel = "Open",
  imageSrc,
}: {
  investment: Investment;
  index: number;
  href?: string;
  statusLabel?: string;
  imageSrc?: string;
}) {
  return (
    <Card
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative animate-in gap-0 rounded-2xl px-1.5 py-1.5 ring-foreground/8 transition-[box-shadow,translate] duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:shadow-lg hover:ring-foreground/15 motion-safe:hover:-translate-y-0.5 motion-reduce:animate-none"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-[0.625rem] bg-muted">
        <Image
          src={imageSrc ?? `/assets/images/marketplace/${investment.image}.png`}
          alt={`Architectural illustration of ${investment.name}`}
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/75 via-black/30 to-transparent" />

        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {statusLabel}
        </span>
        <span
          aria-hidden
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
        </span>

        <p className="absolute right-3 bottom-2.5 left-3 flex items-baseline gap-2 text-white">
          <span className="text-4xl font-light tabular-nums">{investment.annualRoi}%</span>
          <span className="text-xs text-white/80">target annual ROI</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-2.5 pt-3.5 pb-2.5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            {/* The ::after stretches this link over the whole card. */}
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {investment.name}
            </Link>
          </h2>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-3.5 shrink-0" />
            {investment.location}
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-2 border-t border-border pt-3.5">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Tenure</dt>
            <dd className="text-sm font-semibold tabular-nums">{investment.tenure} months</dd>
          </div>
          <div className="space-y-0.5 text-right">
            <dt className="text-xs text-muted-foreground">Per unit</dt>
            <dd className="text-sm font-semibold tabular-nums">{naira(investment.unitPrice)}</dd>
          </div>
        </dl>

        <Allocation investment={investment} />
      </div>
    </Card>
  );
}
