"use client";

import { type ReactNode, useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { commissionOn } from "@/lib/referrals";
import { useReferredBy } from "@/lib/referred-by";
import {
  Agreement01Icon,
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight02Icon,
  Download04Icon,
  File02Icon,
  Location01Icon,
  MinusSignIcon,
  PlusSignIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { WALLET } from "../../wallet/_data";
import {
  AGREEMENT_VERSION,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  type Property,
  canInvest,
  coverImage,
  estimateInvestment,
  findProperty,
  fullLocation,
  fundedFraction,
  initialUnits,
  maxOrderUnits,
  naira,
  unitsLeft,
  validUnits,
} from "../page";

const RISK_TEXT =
  "Capital and returns are not guaranteed. Construction delays, title disputes, vacancy, valuation changes and liquidity constraints may reduce or delay payouts.";
const EXIT_TEXT =
  "No on-demand withdrawal. Principal is intended to be returned at maturity, subject to asset realization. Early-exit requests require review, may incur disclosed costs and are not guaranteed.";
const offeringId = (property: Property) => `${property.id.toUpperCase()}-2026`;
const MONTH_YEAR = new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function openPropertyDocument(property: Property, document: "prospectus" | "agreement" | "risk") {
  AppModal.open({
    title: `${property.name} · ${document === "risk" ? "Risk disclosure" : document === "agreement" ? "Investor agreement" : "Prospectus"}`,
    description: `Illustrative preview • version ${AGREEMENT_VERSION}`,
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          {PROPERTY_TYPE_LABELS[property.type]} development in {fullLocation(property)} by {property.developer}, due for
          completion {property.completionDate}. {property.description}
        </p>
        <p>
          {property.tenureMonths}-month term from allocation. Target simple annual ROI: {property.targetRoi}%, before
          applicable taxes and costs. Returns are projections and do not compound.
        </p>
        <p>{RISK_TEXT}</p>
        <p>{EXIT_TEXT}</p>
        <p className="rounded-lg bg-muted p-3 text-muted-foreground">
          This is a design preview. The approved offering documents and legally binding agreement have not been
          connected yet.
        </p>
      </div>
    ),
    primaryButton: { children: "Close preview" },
  });
}

export function PropertyHero({
  property,
  statusLabel = PROPERTY_STATUS_LABELS[property.status],
  imageSrc,
  headingAs: Heading = "h1",
}: {
  property: Property;
  statusLabel?: string;
  imageSrc?: string;
  headingAs?: "h1" | "h2";
}) {
  return (
    <div className="relative aspect-4/3 min-w-0 overflow-hidden rounded-2xl bg-muted sm:aspect-16/9">
      <Image
        src={imageSrc ?? coverImage(property)}
        alt={`Architectural illustration of ${property.name}`}
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
        <Heading className="text-3xl font-light md:text-4xl">{property.name}</Heading>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-4 shrink-0" />
            {fullLocation(property)}
          </span>
          <span>Offering {offeringId(property)}</span>
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

export function PropertyDetails({ property, children }: { property: Property; children?: ReactNode }) {
  const preview = `Preview · v${AGREEMENT_VERSION}`;
  const allocated = fundedFraction(property) * 100;
  const stats = [
    { label: "Target annual ROI", value: `${property.targetRoi}%`, note: "Simple, not guaranteed" },
    { label: "Term", value: `${property.tenureMonths} months`, note: "From allocation" },
    {
      label: "Per unit",
      value: naira(property.unitPrice),
      note: `${property.minUnits}–${property.maxUnits} units per investor`,
    },
    {
      label: "Total offering",
      value: `${property.totalUnits.toLocaleString("en-NG")} units`,
      note: `${naira(property.totalUnits * property.unitPrice)} in total`,
    },
  ];
  const facts = [
    ["Asset type", PROPERTY_TYPE_LABELS[property.type]],
    ["Location", `${fullLocation(property)}, Nigeria`],
    ["Developer", property.developer],
    ["Completion", MONTH_YEAR.format(new Date(property.completionDate))],
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
        <div className="space-y-2 border-t border-border pt-5">
          <Progress
            aria-label={`${property.name} allocation`}
            value={allocated}
            className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-accent"
          />
          <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>{Math.round(allocated)}% allocated</span>
            <span>
              {unitsLeft(property).toLocaleString("en-NG")} of {property.totalUnits.toLocaleString("en-NG")} left
            </span>
          </p>
        </div>
      </Card>

      {children}

      <SectionCard title="About this offering">
        <p className="max-w-prose text-sm/6 text-muted-foreground">{property.description}</p>
        {property.highlights.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-3">
            {property.highlights.map((highlight) => (
              <li key={highlight} className="rounded-xl bg-muted/60 p-3 text-sm/5">
                {highlight}
              </li>
            ))}
          </ul>
        )}
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
            onClick={() => openPropertyDocument(property, "prospectus")}
          />
          <DocumentRow
            icon={Alert02Icon}
            title="Risk disclosure"
            meta={preview}
            onClick={() => openPropertyDocument(property, "risk")}
          />
          <DocumentRow
            icon={Agreement01Icon}
            title="Investor agreement"
            meta={preview}
            onClick={() => openPropertyDocument(property, "agreement")}
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

function EstimateCard({ property }: { property: Property }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [units, setUnits] = useState<number | undefined>(() => initialUnits(property, searchParams.get("units")));
  const available = maxOrderUnits(property);
  const open = canInvest(property);
  const isValid = units !== undefined && validUnits(property, units);
  const estimate = estimateInvestment(property, isValid ? units : 0, WALLET.balance);
  const canAfford = estimate.balanceAfter >= 0;
  const updateUnits = (next: number | undefined) => {
    setUnits(next);
    if (next !== undefined && validUnits(property, next)) {
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
            {unitsLeft(property).toLocaleString("en-NG")} units left
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Remove one unit"
            className="mt-7 size-9 shrink-0 rounded-full"
            disabled={!isValid || units <= property.minUnits}
            onClick={() => updateUnits((units ?? 2) - 1)}
          >
            <HugeiconsIcon icon={MinusSignIcon} aria-hidden />
          </Button>
          <NumberField
            id="property-units"
            label="Units"
            value={units}
            onChange={updateUnits}
            min={property.minUnits}
            max={available}
            className="min-w-0 flex-1"
            labelClassName="justify-center"
            inputClassName="text-center text-base font-semibold tabular-nums"
            error={
              open && !isValid
                ? `Choose ${property.minUnits}–${available.toLocaleString("en-NG")} whole units.`
                : undefined
            }
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
          <SummaryRow
            label={`Projected return, ${property.tenureMonths} months`}
            value={naira(estimate.projectedReturn)}
          />
        </dl>
        <p className="text-xs/5 text-muted-foreground tabular-nums">
          {naira(estimate.principal)} × {property.targetRoi}% × {property.tenureMonths}/12 ={" "}
          {naira(estimate.projectedReturn)}. Simple interest; no compounding. Before any applicable tax or exit costs.
          Actual results may differ. This is a target, not a guaranteed return or financial advice.
        </p>
        {!open && (
          <p role="status" className="rounded-lg bg-muted p-3 text-xs/5 text-muted-foreground">
            {PROPERTY_STATUS_LABELS[property.status]}. This offering isn&apos;t accepting new investments right now.
          </p>
        )}
        {open && !canAfford && (
          <p role="alert" className="text-xs text-destructive">
            Your illustrative wallet balance is insufficient. Fund your wallet to continue.
          </p>
        )}
        <Button
          className="h-11 w-full rounded-full"
          disabled={!open || !isValid || !canAfford}
          onClick={() => router.push(`/dashboard/marketplace/${property.id}/checkout?units=${units}`)}
        >
          Continue with {isValid ? units : 0} {units === 1 ? "unit" : "units"}
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-5">
        <dl className="space-y-2.5">
          <SummaryRow label="Wallet now" value={naira(WALLET.balance)} />
          <SummaryRow label="After purchase" value={naira(estimate.balanceAfter)} />
        </dl>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/wallet" className="font-semibold underline-offset-4 hover:underline">
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

function ReferralPlanCard({
  property,
  amount,
  amountLabel = "Commission if referred",
}: {
  property: Property;
  amount: number;
  amountLabel?: string;
}) {
  const referrer = useReferredBy();
  const plan = property.referralPlan;

  if (!plan) {
    return referrer ? (
      <p className="px-1 text-xs/5 text-muted-foreground">
        This property package has no referral commission. Your property return is shown above.
      </p>
    ) : null;
  }

  const stats = [
    ["Investment duration", `${plan.tenureMonths} months`],
    ["Your target ROI", `${plan.annualRoiPercent}% p.a.`],
    ["Referrer commission", `${plan.commissionPercent}%`],
    [amountLabel, naira(commissionOn(plan, amount))],
  ];

  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
            <HugeiconsIcon icon={UserAdd01Icon} aria-hidden className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Referral plan</p>
            <h2 className="truncate text-sm font-semibold">{plan.name}</h2>
          </div>
        </div>
        <Link href="/dashboard/referrals" className="text-sm font-semibold underline-offset-4 hover:underline">
          Your referral code
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/60 px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm/6">
        {referrer ? (
          <>
            Referred by <span className="font-semibold">{referrer.name}</span> · {referrer.code}. They receive the
            referral commission. You receive the return on your property.
          </>
        ) : (
          "Commission goes to the person who referred an investor. Your own property earns the target ROI shown above."
        )}
      </p>
      <p className="text-xs/5 text-muted-foreground">{plan.commissionTerms}</p>
    </Card>
  );
}

export default function InvestmentPage() {
  const { id } = useParams<{ id: string }>();
  const property = findProperty(id);
  if (!property) notFound();

  return (
    <>
      <Link
        href="/dashboard/marketplace"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        Marketplace
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PropertyHero property={property} />
        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <EstimateCard property={property} />
        </aside>
        <PropertyDetails property={property}>
          <ReferralPlanCard
            property={property}
            amount={property.unitPrice * property.minUnits}
            amountLabel="Commission on minimum investment"
          />
        </PropertyDetails>
      </div>
    </>
  );
}
