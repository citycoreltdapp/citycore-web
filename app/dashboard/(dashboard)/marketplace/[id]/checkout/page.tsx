"use client";

import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { OtpField } from "@/components/primitives/otp-field";
import { Stepper } from "@/components/primitives/stepper";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type AgreementFormValues,
  type InvestmentReceipt,
  agreementFormSchema as agreementSchema,
  investRequestSchema,
} from "@/constant/schemas/marketplace";
import { commissionOn } from "@/lib/referrals";
import { useReferredBy } from "@/lib/referred-by";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, Download04Icon, File02Icon, Tick02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { WALLET } from "../../../wallet/_data";
import {
  AGREEMENT_VERSION,
  PROPERTY_TYPE_LABELS,
  type Property,
  canInvest,
  coverImage,
  estimateInvestment,
  findProperty,
  fullLocation,
  naira,
  validUnits,
} from "../../page";

const STEPS = [{ title: "Property" }, { title: "Agreement" }, { title: "Confirmation" }];
const NEXT_STEPS = [
  "Receive your purchase reference.",
  "Download the signed agreement and receipt.",
  "Track the allocation in My Investments.",
];
const AGREEMENT_FORM_ID = "investor-agreement";
const AGREEMENT_DATE = "22 October 2026";
const RISK_TEXT =
  "Capital and returns are not guaranteed. Construction delays, title disputes, vacancy, valuation changes and liquidity constraints may reduce or delay payouts.";
const EXIT_TEXT =
  "No on-demand withdrawal. Principal is intended to be returned at maturity, subject to asset realization. Early-exit requests require review, may incur disclosed costs and are not guaranteed.";
const CONSENTS = [
  { name: "risks", label: "I have read the prospectus and understand the investment risks." },
  { name: "exit", label: "I understand that no early exit or return is guaranteed." },
  { name: "agreement", label: "I accept the investor agreement and electronic-signature terms." },
] as const;
const MATURITY = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const revealResult = (element: HTMLElement | null) => element?.scrollIntoView({ block: "center", behavior: "smooth" });

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function openPropertyDocument(property: Property) {
  AppModal.open({
    title: `${property.name} · Investor agreement`,
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
        <Link href="/referrals" className="text-sm font-semibold underline-offset-4 hover:underline">
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

function AgreementForm({
  property,
  estimate,
  onConfirm,
}: {
  property: Property;
  estimate: ReturnType<typeof estimateInvestment>;
  onConfirm: (values: AgreementFormValues) => void;
}) {
  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(agreementSchema),
    mode: "onTouched",
    defaultValues: { name: "", pin: "" },
  });

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <section className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">Investor agreement</h2>
            <p className="text-xs text-muted-foreground">
              Version {AGREEMENT_VERSION} · {AGREEMENT_DATE}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => openPropertyDocument(property)}
            >
              <HugeiconsIcon icon={File02Icon} aria-hidden />
              Read agreement
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => toast.info("The approved PDF hasn't been uploaded yet.")}
            >
              <HugeiconsIcon icon={Download04Icon} aria-hidden />
              PDF
            </Button>
          </div>
        </div>
        <p className="max-w-prose text-sm/6 text-muted-foreground tabular-nums">
          {property.tenureMonths}-month term from allocation. The target simple annual ROI is {property.targetRoi}%; the
          estimated {naira(estimate.projectedReturn)} return and {naira(estimate.maturity)} maturity value are
          projections, not guarantees. Capital may be lost and maturity may be delayed.
        </p>
      </section>

      <form id={AGREEMENT_FORM_ID} noValidate className="contents" onSubmit={form.handleSubmit(onConfirm)}>
        <fieldset className="flex flex-col gap-2.5 border-t border-border p-5">
          <legend className="float-left mb-1.5 w-full text-sm font-semibold">Your acknowledgements</legend>
          {CONSENTS.map(({ name, label }) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5 text-sm/5 transition-colors hover:bg-muted/50 has-aria-invalid:border-destructive/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60">
                    <Checkbox
                      id={`consent-${name}`}
                      checked={field.value === true}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={!!fieldState.error}
                      aria-describedby={fieldState.error ? `${name}-error` : undefined}
                      className="mt-0.5"
                    />
                    {label}
                  </label>
                  {fieldState.error && (
                    <p id={`${name}-error`} className="mt-1.5 text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          ))}
        </fieldset>

        <section className="flex flex-col gap-4 border-t border-border p-5">
          <h3 className="text-sm font-semibold">Your signature</h3>
          <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="investor-legal-name"
                  label="Type your legal name"
                  placeholder="Your full legal name"
                  autoComplete="name"
                  error={fieldState.error?.message}
                  helpText="Signature preview only. No signature is collected in this demo."
                />
              )}
            />
            <div className="text-sm sm:text-right">
              <p className="text-muted-foreground">Agreement date</p>
              <p className="mt-1.5 font-semibold tabular-nums">{AGREEMENT_DATE}</p>
            </div>
          </div>
          <Controller
            control={form.control}
            name="pin"
            render={({ field, fieldState }) => (
              <OtpField
                {...field}
                id="investment-pin"
                label="4-digit transaction PIN"
                length={4}
                mask
                error={fieldState.error?.message}
                className="max-w-60"
              />
            )}
          />
          <p className="text-xs/5 text-muted-foreground">
            Review your name and the full agreement before signing. In the product, confirmation records the agreement
            version, consent time and purchase reference.
          </p>
        </section>
      </form>
    </Card>
  );
}

function OrderSummary({
  property,
  units,
  estimate,
  confirmed,
  changeHref,
}: {
  property: Property;
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
              src={coverImage(property)}
              alt={`Architectural illustration of ${property.name}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{property.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{fullLocation(property)}</p>
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
            {units} {units === 1 ? "unit" : "units"} × {naira(property.unitPrice)} · {naira(0)} purchase fee
          </p>
        </div>

        <dl className="space-y-2.5 border-t border-border pt-4">
          <SummaryRow
            label={`Projected return, ${property.tenureMonths} months`}
            value={naira(estimate.projectedReturn)}
          />
          <SummaryRow label="Projected maturity" value={naira(estimate.maturity)} />
        </dl>

        <p className="rounded-lg bg-warning/15 p-3 text-xs/5 text-warning">
          Target, not guaranteed. Estimate assumes the full {property.tenureMonths}-month term, simple interest and no
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
          <SummaryRow label="Balance before" value={naira(WALLET.balance)} />
          <SummaryRow label="Balance after" value={naira(estimate.balanceAfter)} />
        </dl>
      </div>
    </Card>
  );
}

export default function InvestmentCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const units = Number(useSearchParams().get("units") ?? "2");
  const property = findProperty(id);
  if (!property) notFound();
  const isValid = canInvest(property) && validUnits(property, units);
  const estimate = estimateInvestment(property, isValid ? units : 0, WALLET.balance);
  const [receipt, setReceipt] = useState<InvestmentReceipt | null>(null);
  const confirmed = receipt !== null;
  const changeHref = `/marketplace/${property.id}${isValid ? `?units=${units}` : ""}`;

  if (!isValid)
    return (
      <Card className="border ring-0">
        <CardHeader>
          <CardTitle>Choose your property units</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>This offering isn&apos;t open, or the number of units is outside what one investor can buy.</p>
          <Button className="self-start rounded-full" render={<Link href={changeHref} />} nativeButton={false}>
            Return to property
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <>
      <Link
        href={changeHref}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        {property.name}
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout & Investor Agreement</h1>
        <p className="text-sm text-muted-foreground tabular-nums">
          {property.name} · {units} {units === 1 ? "unit" : "units"} · {naira(estimate.principal)}
        </p>
      </header>

      <Stepper steps={STEPS} currentStep={confirmed ? 2 : 1} />

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
              <h2 className="text-2xl font-light">Investment confirmed</h2>
              <p className="max-w-prose text-sm/6 text-muted-foreground">
                Illustrative receipt. No purchase, signature or wallet debit has been recorded until the backend is
                connected.
              </p>
            </div>
            <dl className="grid w-full gap-x-8 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
              {[
                ["Reference", receipt.reference],
                ["Units", receipt.units.toLocaleString("en-NG")],
                ["Amount", naira(receipt.amount)],
                ["Matures on", MATURITY.format(new Date(receipt.maturityDate))],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <Button className="h-10 rounded-full px-5" render={<Link href="/marketplace" />} nativeButton={false}>
              Back to marketplace
            </Button>
          </Card>
        ) : (
          <AgreementForm
            property={property}
            estimate={estimate}
            onConfirm={({ pin, name }) => {
              if (estimate.balanceAfter < 0) return;
              investRequestSchema.parse({
                units,
                pin,
                agreementVersion: AGREEMENT_VERSION,
                signatureName: name,
                idempotencyKey: crypto.randomUUID(),
              });
              const maturity = new Date();
              maturity.setMonth(maturity.getMonth() + property.tenureMonths);
              setReceipt({
                reference: `CC${Date.now() % 100_000_000}`,
                units,
                amount: estimate.principal,
                maturityDate: maturity.toISOString().slice(0, 10),
              });
            }}
          />
        )}

        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <OrderSummary
            property={property}
            units={units}
            estimate={estimate}
            confirmed={confirmed}
            changeHref={changeHref}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <ReferralPlanCard property={property} amount={estimate.principal} />
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
      </div>
    </>
  );
}
