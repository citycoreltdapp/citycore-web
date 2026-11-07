import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Agreement01Icon, Alert02Icon, Download04Icon, File02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { toast } from "sonner";

import { AGREEMENT_VERSION, type Investment, naira } from "../_data";
import { EXIT_TEXT, RISK_TEXT, openInvestmentDocument } from "../_documents";
import { Allocation } from "../_investment-parts";

const offeringId = (investment: Investment) => `${investment.id.toUpperCase()}-2026`;

export function PropertyHero({
  investment,
  statusLabel = "Open for investment",
  imageSrc,
  headingAs: Heading = "h1",
}: {
  investment: Investment;
  statusLabel?: string;
  imageSrc?: string;
  headingAs?: "h1" | "h2";
}) {
  return (
    <div className="relative aspect-4/3 min-w-0 overflow-hidden rounded-2xl bg-muted sm:aspect-16/9">
      <Image
        src={imageSrc ?? `/assets/images/marketplace/${investment.image}.png`}
        alt={`Architectural illustration of ${investment.name}`}
        fill
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/90 via-black/50 to-transparent" />

      <div className="absolute inset-x-3 top-3 flex flex-wrap justify-between gap-2 text-[11px] text-white">
        <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {statusLabel}
        </span>
        <span className="rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm">Illustration, not a photograph</span>
      </div>

      <div className="absolute inset-x-5 bottom-4 text-white md:inset-x-6 md:bottom-5">
        <Heading className="text-3xl font-light md:text-4xl">{investment.name}</Heading>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-4 shrink-0" />
            {investment.location}
          </span>
          <span>Offering {offeringId(investment)}</span>
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function DocumentRow({
  icon,
  title,
  meta,
  onClick,
}: {
  icon: IconSvgElement;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
        <HugeiconsIcon icon={icon} aria-hidden className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{meta}</span>
      </span>
    </button>
  );
}

export function PropertyDetails({
  investment,
  description,
  assetType = "Residential development",
  minimumUnits = 1,
}: {
  investment: Investment;
  description?: string;
  assetType?: string;
  minimumUnits?: number;
}) {
  const preview = `Preview · v${AGREEMENT_VERSION}`;
  const stats = [
    { label: "Target annual ROI", value: `${investment.annualRoi}%`, note: "Simple, not guaranteed" },
    { label: "Term", value: `${investment.tenure} months`, note: "From allocation" },
    {
      label: "Per unit",
      value: naira(investment.unitPrice),
      note: `Minimum ${minimumUnits} ${minimumUnits === 1 ? "unit" : "units"}`,
    },
    {
      label: "Total offering",
      value: `${investment.totalUnits.toLocaleString("en-NG")} units`,
      note: `${naira(investment.totalUnits * investment.unitPrice)} in total`,
    },
  ];
  const facts = [
    ["Asset type", assetType],
    ["Location", `${investment.location}, Nigeria`],
    ["Returns", "Simple interest, no compounding"],
    ["Reporting", "Quarterly progress updates"],
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {stats.map(({ label, value, note }) => (
            <div key={label} className="min-w-0 xl:pl-5 xl:first:pl-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-2xl font-light tabular-nums">{value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-border pt-5">
          <Allocation investment={investment} />
        </div>
      </Card>

      <SectionCard title="About this offering">
        <p className="max-w-prose text-sm/6 text-muted-foreground">
          {description ??
            "Allocation funds acquisition and staged development of residential units. City Core provides quarterly progress updates and reporting against the offering milestones."}
        </p>
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-t border-border py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Documents">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <DocumentRow
            icon={File02Icon}
            title="Prospectus"
            meta={preview}
            onClick={() => openInvestmentDocument(investment, "prospectus")}
          />
          <DocumentRow
            icon={Alert02Icon}
            title="Risk disclosure"
            meta={preview}
            onClick={() => openInvestmentDocument(investment, "risk")}
          />
          <DocumentRow
            icon={Agreement01Icon}
            title="Investor agreement"
            meta={preview}
            onClick={() => openInvestmentDocument(investment, "agreement")}
          />
          <DocumentRow
            icon={Download04Icon}
            title="Brochure"
            meta="PDF download"
            onClick={() => toast.info("The approved PDF hasn't been uploaded yet.")}
          />
        </div>
      </SectionCard>

      <SectionCard title="Risk & exit terms">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold">Risk</h3>
            <p className="text-sm/6 text-muted-foreground">{RISK_TEXT}</p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold">Exit</h3>
            <p className="text-sm/6 text-muted-foreground">{EXIT_TEXT}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
