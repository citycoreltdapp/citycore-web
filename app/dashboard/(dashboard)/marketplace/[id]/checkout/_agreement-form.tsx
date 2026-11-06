"use client";

import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download04Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AGREEMENT_VERSION, type Investment, type estimateInvestment, naira } from "../../_data";
import { openInvestmentDocument } from "../../_documents";

export const AGREEMENT_FORM_ID = "investor-agreement";
const AGREEMENT_DATE = "22 October 2026";

const agreementSchema = z.object({
  risks: z.literal(true, { error: "Please acknowledge the investment risks." }),
  exit: z.literal(true, { error: "Please acknowledge the exit terms." }),
  agreement: z.literal(true, { error: "Please accept the agreement." }),
  name: z.string().trim().min(2, "Enter your full legal name.").max(150, "Your name is too long."),
});
const CONSENTS = [
  { name: "risks", label: "I have read the prospectus and understand the investment risks." },
  { name: "exit", label: "I understand that no early exit or return is guaranteed." },
  { name: "agreement", label: "I accept the investor agreement and electronic-signature terms." },
] as const;

export function AgreementForm({
  investment,
  estimate,
  onConfirm,
}: {
  investment: Investment;
  estimate: ReturnType<typeof estimateInvestment>;
  onConfirm: () => void;
}) {
  const form = useForm({ resolver: zodResolver(agreementSchema), mode: "onTouched", defaultValues: { name: "" } });

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
              onClick={() => openInvestmentDocument(investment, "agreement")}
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
          {investment.tenure}-month term from allocation. The target simple annual ROI is {investment.annualRoi}%; the
          estimated {naira(estimate.projectedReturn)} return and {naira(estimate.maturity)} maturity value are
          projections, not guarantees. Capital may be lost and maturity may be delayed.
        </p>
      </section>

      <form id={AGREEMENT_FORM_ID} noValidate className="contents" onSubmit={form.handleSubmit(() => onConfirm())}>
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
          <p className="text-xs/5 text-muted-foreground">
            Review your name and the full agreement before signing. In the product, confirmation records the agreement
            version, consent time and purchase reference.
          </p>
        </section>
      </form>
    </Card>
  );
}
