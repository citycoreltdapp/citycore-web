"use client";

import { useState } from "react";

import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Property } from "@/constant/schemas/marketplace";
import { REFERRAL_PLAN } from "@/lib/referrals";
import { ArrowUpRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { WALLET } from "../wallet/_data";

export type { Property } from "@/constant/schemas/marketplace";

export const AGREEMENT_VERSION = "1.3";

const illustration = (name: string) => `/assets/images/marketplace/${name}.png`;

export const PROPERTIES: Property[] = [
  {
    id: "golden-estate",
    name: "Golden Estate",
    location: "Lekki Phase 1",
    city: "Lagos",
    type: "residential",
    status: "open",
    images: [illustration("golden-estate")],
    unitPrice: 150_000,
    targetRoi: REFERRAL_PLAN.annualRoiPercent,
    tenureMonths: REFERRAL_PLAN.tenureMonths,
    totalUnits: 1000,
    unitsSold: 680,
    minUnits: 1,
    maxUnits: 50,
    developer: "Landmark Homes Ltd",
    completionDate: "2027-09-01",
    description:
      "A gated community of 24 four-bedroom terraces with a clubhouse, solar-backed power and 24-hour security, minutes from the Lekki toll gate. Returns come from pre-sale appreciation and rental income once units are let.",
    highlights: [
      "Verified C of O and approved building plan",
      "Rental demand above 92% occupancy in the area",
      "Quarterly construction updates with photos",
    ],
    referralPlan: REFERRAL_PLAN,
  },
  {
    id: "palm-court",
    name: "Palm Court Residences",
    location: "Maitama",
    city: "Abuja",
    type: "residential",
    status: "open",
    images: [illustration("residences")],
    unitPrice: 250_000,
    targetRoi: 18,
    tenureMonths: 18,
    totalUnits: 600,
    unitsSold: 214,
    minUnits: 1,
    maxUnits: 30,
    developer: "Cityscape Developers",
    completionDate: "2028-03-01",
    description:
      "Serviced apartments in the heart of Maitama, designed for diplomats and executives on short and mid-term leases.",
    highlights: [
      "Pre-let agreements for 40% of units",
      "Professional facility management",
      "Steady US-dollar-linked rental demand",
    ],
  },
  {
    id: "harbour-point",
    name: "Harbour Point Offices",
    location: "Victoria Island",
    city: "Lagos",
    type: "commercial",
    status: "fundingSoon",
    images: [illustration("skyline")],
    unitPrice: 500_000,
    targetRoi: 20,
    tenureMonths: 24,
    totalUnits: 400,
    unitsSold: 0,
    minUnits: 1,
    maxUnits: 20,
    developer: "Atlantic Realty",
    completionDate: "2028-12-01",
    description:
      "Grade-A office space overlooking the lagoon with flexible floor plates for growing tech and finance teams.",
    highlights: [
      "Anchor tenant in final negotiation",
      "LEED-certified, energy-efficient design",
      "Opens for investment soon",
    ],
  },
  {
    id: "cedar-gardens",
    name: "Cedar Gardens",
    location: "GRA",
    city: "Port Harcourt",
    type: "residential",
    status: "open",
    images: [illustration("waterfront")],
    unitPrice: 100_000,
    targetRoi: 15,
    tenureMonths: 12,
    totalUnits: 800,
    unitsSold: 702,
    minUnits: 1,
    maxUnits: 40,
    developer: "Greenline Properties",
    completionDate: "2027-06-01",
    description: "Family duplexes in a quiet, tree-lined estate close to schools and the city centre.",
    highlights: [
      "Over 85% of units already allocated",
      "Mortgage-ready titles for end buyers",
      "Low entry price from ₦100,000",
    ],
  },
  {
    id: "marina-heights",
    name: "Marina Heights",
    location: "Ikoyi",
    city: "Lagos",
    type: "mixedUse",
    status: "fullyFunded",
    images: [illustration("city-lights")],
    unitPrice: 300_000,
    targetRoi: 17,
    tenureMonths: 12,
    totalUnits: 500,
    unitsSold: 500,
    minUnits: 1,
    maxUnits: 25,
    developer: "Landmark Homes Ltd",
    completionDate: "2027-02-01",
    description: "Retail at ground level with luxury apartments above, on the Ikoyi waterfront.",
    highlights: ["Fully funded in 19 days", "Retail floor fully leased", "Investors receive quarterly yield reports"],
  },
];

export const findProperty = (id: string) => PROPERTIES.find((property) => property.id === id);

export const naira = (amount: number) =>
  `${amount < 0 ? "-" : ""}₦${Math.abs(amount).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const unitsLeft = (property: Property) => property.totalUnits - property.unitsSold;
export const fundedFraction = (property: Property) =>
  property.totalUnits === 0 ? 0 : property.unitsSold / property.totalUnits;
export const canInvest = (property: Property) => property.status === "open" && unitsLeft(property) > 0;
export const coverImage = (property: Property) => property.images[0] ?? "";
export const returnFor = (property: Property, units: number) =>
  Math.round(((units * property.unitPrice * property.targetRoi) / 100) * (property.tenureMonths / 12) * 100) / 100;
export const fullLocation = (property: Property) => `${property.location}, ${property.city}`;

export const PROPERTY_TYPE_LABELS: Record<Property["type"], string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixedUse: "Mixed use",
};
export const PROPERTY_STATUS_LABELS: Record<Property["status"], string> = {
  open: "Open for investment",
  fundingSoon: "Funding soon",
  fullyFunded: "Fully funded",
};

export const maxOrderUnits = (property: Property) => Math.min(property.maxUnits, unitsLeft(property));
export const validUnits = (property: Property, units: number) =>
  Number.isSafeInteger(units) && units >= property.minUnits && units <= maxOrderUnits(property);
export const initialUnits = (property: Property, raw: string | null) => {
  const units = raw === null ? Math.max(2, property.minUnits) : Number(raw);
  return validUnits(property, units) ? units : Math.min(Math.max(2, property.minUnits), maxOrderUnits(property));
};
export function estimateInvestment(property: Property, units: number, walletBalance: number) {
  const principal = property.unitPrice * units;
  const projectedReturn = returnFor(property, units);
  return {
    principal,
    projectedReturn,
    maturity: principal + projectedReturn,
    balanceAfter: walletBalance - principal,
  };
}

const CITIES = [...new Set(PROPERTIES.map((property) => property.city))];
const TENURES = [...new Set(PROPERTIES.map((property) => property.tenureMonths))].toSorted((a, b) => a - b);
const FILTER_TRIGGER = "h-10! w-full rounded-full bg-card px-3.5 lg:w-auto lg:min-w-32";

export function PropertyCard({
  property,
  index,
  href = `/marketplace/${property.id}`,
  statusLabel = PROPERTY_STATUS_LABELS[property.status],
  imageSrc,
}: {
  property: Property;
  index: number;
  href?: string;
  statusLabel?: string;
  imageSrc?: string;
}) {
  const allocated = fundedFraction(property) * 100;

  return (
    <Card
      style={{ animationDelay: `${index * 50}ms` }}
      className="group relative animate-in gap-0 rounded-2xl px-1.5 py-1.5 ring-foreground/8 transition-[box-shadow,translate] duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:shadow-lg hover:ring-foreground/15 motion-safe:hover:-translate-y-0.5 motion-reduce:animate-none"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-[0.625rem] bg-muted">
        <Image
          src={imageSrc ?? coverImage(property)}
          alt={`Architectural illustration of ${property.name}`}
          fill
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
          <span
            aria-hidden
            className={canInvest(property) ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-white/50"}
          />
          {statusLabel}
        </span>
        <span
          aria-hidden
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
        </span>
        <p className="absolute right-3 bottom-2.5 left-3 flex items-baseline gap-2 text-white">
          <span className="text-4xl font-light tabular-nums">{property.targetRoi}%</span>
          <span className="text-xs text-white/80">target annual ROI</span>
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-2.5 pt-3.5 pb-2.5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {property.name}
            </Link>
          </h2>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} aria-hidden className="size-3.5 shrink-0" />
            {fullLocation(property)}
          </p>
        </div>
        <dl className="mt-auto grid grid-cols-2 border-t border-border pt-3.5">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Tenure</dt>
            <dd className="text-sm font-semibold tabular-nums">{property.tenureMonths} months</dd>
          </div>
          <div className="space-y-0.5 text-right">
            <dt className="text-xs text-muted-foreground">Per unit</dt>
            <dd className="text-sm font-semibold tabular-nums">{naira(property.unitPrice)}</dd>
          </div>
        </dl>
        <div className="space-y-2">
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
      </div>
    </Card>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [type, setType] = useState("all");
  const [tenure, setTenure] = useState("all");
  const [price, setPrice] = useState("all");
  const properties = PROPERTIES.filter(
    (property) =>
      `${property.name} ${fullLocation(property)} ${property.id} ${property.developer} ${PROPERTY_TYPE_LABELS[property.type]}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (city === "all" || property.city === city) &&
      (type === "all" || property.type === type) &&
      (tenure === "all" || property.tenureMonths === Number(tenure)) &&
      (price === "all" || (price === "under" ? property.unitPrice <= 150_000 : property.unitPrice > 150_000))
  );
  const isFiltered = search !== "" || [city, type, tenure, price].some((filter) => filter !== "all");
  const reset = () => {
    setSearch("");
    setCity("all");
    setType("all");
    setTenure("all");
    setPrice("all");
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">New Investment Marketplace</h1>
          <p className="text-sm/6 text-muted-foreground">
            Properties and availability shown are illustrative. Target returns are projections, not a guarantee. Capital
            is at risk, so review the prospectus before investing.
          </p>
        </div>
        <Link href="/wallet" className="group/wallet shrink-0 sm:text-right">
          <span className="block text-xs text-muted-foreground">Available wallet</span>
          <span className="text-xl font-semibold tabular-nums group-hover/wallet:underline">
            {naira(WALLET.balance)}
          </span>
        </Link>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchField
          id="investment-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, location or developer"
          className="min-w-0 flex-1"
          groupClassName="h-10 bg-card dark:bg-card"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
          <SelectField
            id="investment-city"
            value={city}
            onChange={setCity}
            triggerAria-label="City"
            triggerClassName={FILTER_TRIGGER}
            items={[{ value: "all", label: "All cities" }, ...CITIES.map((value) => ({ value, label: value }))]}
          />
          <SelectField
            id="investment-type"
            value={type}
            onChange={setType}
            triggerAria-label="Property type"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any type" },
              ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <SelectField
            id="investment-tenure"
            value={tenure}
            onChange={setTenure}
            triggerAria-label="Tenure"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any tenure" },
              ...TENURES.map((value) => ({ value: String(value), label: `${value} months` })),
            ]}
          />
          <SelectField
            id="investment-price"
            value={price}
            onChange={setPrice}
            triggerAria-label="Unit price"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any price" },
              { value: "under", label: "Up to ₦150,000" },
              { value: "over", label: "Above ₦150,000" },
            ]}
          />
        </div>
      </div>

      <div className="flex h-5 items-center justify-between gap-3 text-sm">
        <p role="status" className="text-muted-foreground tabular-nums">
          {properties.length} {properties.length === 1 ? "opportunity" : "opportunities"}
        </p>
        {isFiltered && properties.length > 0 && (
          <button type="button" onClick={reset} className="font-medium underline-offset-4 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {properties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>
      {properties.length === 0 && (
        <Card className="items-center gap-3 p-10 text-center">
          <h2 className="font-semibold">No investments match your filters</h2>
          <p className="text-sm text-muted-foreground">Try another name, location or investment range.</p>
          <Button variant="secondary" onClick={reset}>
            Clear filters
          </Button>
        </Card>
      )}
    </>
  );
}
