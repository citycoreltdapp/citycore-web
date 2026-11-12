"use client";

import type { ReactNode } from "react";

import { useCurrentUser } from "@/actions/auth";
import { useKycState } from "@/actions/kyc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_TYPES } from "@/constant/corporate-onboarding";
import type { KycStatus } from "@/constant/onboarding";
import { phoneNumberFromE164, phoneNumberToString } from "@/lib/phone-number";
import { useKycStatus } from "@/lib/verification-status";
import {
  ArrowRight02Icon,
  Building06Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";

export const greeting = () => {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(new Date())
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

const STATUS: Record<KycStatus, { label: string; dot: string }> = {
  verified: { label: "Verified business", dot: "bg-[#86c29b]" },
  pending: { label: "Verification in review", dot: "bg-accent" },
  actionRequired: { label: "Needs attention", dot: "bg-warning" },
  notStarted: { label: "Not verified", dot: "bg-white/40" },
};

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

function CompanyMark({ name, logo, className }: { name?: string; logo?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-lg font-semibold text-white ring-1 ring-white/10",
        className
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- an uploaded logo from the CDN
        <img src={logo} alt="" className="size-full bg-white object-cover" />
      ) : name ? (
        initials(name)
      ) : (
        <HugeiconsIcon icon={Building06Icon} aria-hidden className="size-6" />
      )}
    </span>
  );
}

function GridArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 220"
      className="pointer-events-none absolute -right-10 bottom-0 hidden h-full text-white/[0.07] lg:block"
    >
      {Array.from({ length: 9 }, (_, column) => (
        <rect
          key={`c${column}`}
          x={column * 36 + 8}
          y={220 - (column % 4) * 30 - 70}
          width="22"
          height="220"
          rx="3"
          fill="currentColor"
        />
      ))}
      {Array.from({ length: 6 }, (_, row) => (
        <line
          key={`r${row}`}
          x1="0"
          x2="320"
          y1={row * 36 + 20}
          y2={row * 36 + 20}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function CorporateBanner() {
  const { data: user } = useCurrentUser();
  const { data: kyc } = useKycState();
  const status = useKycStatus();
  const business = kyc?.business;
  const type = COMPANY_TYPES.find((option) => option.value === business?.companyType);
  const meta = status ? STATUS[status] : null;
  const firstName = user?.name.split(" ")[0];

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#121212] p-6 text-white md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-1/3 size-72 rounded-full bg-accent/20 blur-3xl"
      />
      <GridArt />
      <div className="relative z-10 flex max-w-2xl flex-col gap-6">
        <div className="flex items-start gap-4">
          <CompanyMark
            name={business?.companyName}
            logo={kyc?.documents.companyLogo?.url ?? user?.avatar}
            className="size-16"
          />
          <div className="min-w-0">
            <p className="text-sm text-white/60">
              {greeting()}
              {firstName && `, ${firstName}`}
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight md:text-3xl">
              {business?.companyName ?? "Your business"}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {business && type && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium tabular-nums">
                  {type.prefix} {business.registrationNumber}
                </span>
              )}
              {type && <span className="rounded-full bg-white/10 px-2.5 py-1">{type.label}</span>}
              {meta && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                  <span aria-hidden className={cn("size-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm/6 text-white/70 md:text-base/7">
          {business
            ? `Manage ${business.companyName}'s treasury, track positions and invest in vetted real estate from one place.`
            : "Verify your business to invest as a company. It takes three short steps with your CAC number."}
          {kyc?.signatory && (
            <span className="mt-1 block text-sm text-white/50">
              Signed in as {kyc.signatory.fullName} · {titleCase(kyc.signatory.role)}
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          {business ? (
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/marketplace" />}
              className="h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/85"
            >
              Explore opportunities
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/onboarding" />}
              className="h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/85"
            >
              Verify business
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-border py-3 last:border-none">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function Check({ done, label, optional }: { done: boolean; label: string; optional?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <HugeiconsIcon
        icon={done ? CheckmarkCircle02Icon : CircleIcon}
        aria-hidden
        className={cn("size-4 shrink-0", done ? "text-success" : "text-muted-foreground/50")}
      />
      <span className={cn(!done && "text-muted-foreground")}>{label}</span>
      {optional && !done && <span className="text-xs text-muted-foreground">Optional</span>}
      <span className="sr-only">{done ? "done" : "to do"}</span>
    </li>
  );
}

export function CompanyProfileCard({ className }: { className?: string }) {
  const { data: kyc } = useKycState();
  const business = kyc?.business;
  const type = COMPANY_TYPES.find((option) => option.value === business?.companyType);
  const canEdit = kyc?.status === "not_started" || kyc?.status === "draft" || kyc?.status === "rejected";

  return (
    <Card className={cn("ring-0", className)}>
      <CardHeader className="flex items-center justify-between gap-3 border-b border-dashed px-5 pb-4">
        <CardTitle className="text-lg font-semibold">Company profile</CardTitle>
        {business && canEdit && (
          <Link
            href="/dashboard/onboarding"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Edit
          </Link>
        )}
      </CardHeader>
      <CardContent className="px-5">
        {business ? (
          <>
            <dl>
              <Row label="Registration">
                <span className="tabular-nums">
                  {type?.prefix} {business.registrationNumber}
                </span>
                {business.tin && <span className="text-muted-foreground tabular-nums"> · TIN {business.tin}</span>}
              </Row>
              <Row label="Registered address">{business.registeredAddress ?? "Not on record"}</Row>
              <Row label="Contact">
                {business.email ?? "Not added"}
                {business.phone && (
                  <span className="block text-muted-foreground">
                    {phoneNumberToString(phoneNumberFromE164(business.phone))}
                  </span>
                )}
              </Row>
              <Row label="Authorised signatory">
                {kyc.signatory ? (
                  <span className="flex items-center gap-1.5">
                    {kyc.signatory.fullName}
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      aria-label="ID verified"
                      className="size-4 text-success"
                    />
                  </span>
                ) : (
                  "Not verified yet"
                )}
              </Row>
              <Row label="Payout account">
                {kyc.payout ? (
                  <>
                    {kyc.payout.bankName}
                    <span className="text-muted-foreground tabular-nums">
                      {" "}
                      · ••••{kyc.payout.accountNumber.slice(-4)}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Not added</span>
                    <Link href="/dashboard/withdrawals" className="font-semibold underline-offset-4 hover:underline">
                      Add
                    </Link>
                  </span>
                )}
              </Row>
            </dl>
            <ul aria-label="Verification checklist" className="mt-2 flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
              <Check done label="Company found on CAC" />
              <Check done={!!business.detailsCompletedAt} label="Contact details" />
              <Check done={!!kyc.documents.utilityBill} label="Proof of address" />
              <Check done={!!kyc.signatory} label="Signatory verified" />
              {kyc.signatory && !kyc.signatory.onCacRecord && (
                <Check done={!!kyc.documents.authorisationLetter} label="Authorisation letter" />
              )}
              <Check done={!!kyc.payout} label="Payout account" optional />
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Building06Icon} aria-hidden className="size-6" />
            </span>
            <p className="text-sm font-semibold">No business on file yet</p>
            <p className="max-w-56 text-xs text-muted-foreground">
              Find your company with its CAC number to see its profile here.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/onboarding" />}
              className="mt-1 h-9 rounded-full px-4"
            >
              Verify business
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
