"use client";

import { NumberField } from "@/components/primitives/number-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fundingFormSchema } from "@/constant/schemas/finance";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCircleIcon, BankIcon, Copy01Icon, CreditCardIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SummaryRow } from "../marketplace/_investment-parts";
import { FUNDING_METHODS, type FundingMethodKey } from "./_data";

export const DEPOSIT_AMOUNT_ID = "deposit-amount";

const METHOD_KEYS = Object.keys(FUNDING_METHODS) as FundingMethodKey[];
const METHOD_ICONS = { bank: BankIcon, card: CreditCardIcon, virtual: Wallet01Icon };
const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000];

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-US")}`;

function CopyButton({ value }: { value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Reference copied.");
    } catch {
      toast.error("Couldn't copy the reference. Copy it by hand instead.");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="ml-1 align-middle"
      aria-label={`Copy ${value}`}
      onClick={copy}
    >
      <HugeiconsIcon icon={Copy01Icon} aria-hidden />
    </Button>
  );
}

function FundingDetailsCard({
  amount,
  onAmountChange,
  methodKey,
  onMethodChange,
  error,
}: {
  amount: number | undefined;
  onAmountChange: (amount: number | undefined) => void;
  methodKey: FundingMethodKey;
  onMethodChange: (method: FundingMethodKey) => void;
  error?: string;
}) {
  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-3 p-5">
        <NumberField
          id={DEPOSIT_AMOUNT_ID}
          error={error}
          label="Deposit amount"
          prefix={<span className="text-3xl font-light text-foreground">₦</span>}
          value={amount}
          onChange={onAmountChange}
          labelClassName="text-base font-semibold"
          groupClassName="h-18 rounded-xl bg-muted/40 pl-2 dark:bg-muted/40"
          inputClassName="h-full text-4xl font-light tabular-nums md:text-4xl"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <Button
              type="button"
              key={value}
              variant={amount === value ? "default" : "outline"}
              className="h-8 rounded-full px-3 text-xs tabular-nums"
              aria-pressed={amount === value}
              onClick={() => onAmountChange(value)}
            >
              {formatNaira(value)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="funding-method-label" className="text-base font-semibold">
            Pay with
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-full px-2.5 text-xs"
            onClick={() => toast.info("Adding a card isn't connected to a backend yet.")}
          >
            <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
            Add payment card
          </Button>
        </div>
        <RadioGroup
          aria-labelledby="funding-method-label"
          value={methodKey}
          onValueChange={(next) => onMethodChange(next as FundingMethodKey)}
          className="xl:grid-cols-3"
        >
          {METHOD_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon icon={METHOD_ICONS[key]} aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{FUNDING_METHODS[key].label}</span>
                <span className="block truncate text-xs text-muted-foreground">{FUNDING_METHODS[key].hint}</span>
              </span>
              <RadioGroupItem value={key} />
            </label>
          ))}
        </RadioGroup>
      </div>
    </Card>
  );
}

function FundingSummaryCard({ amount, methodKey }: { amount: number | undefined; methodKey: FundingMethodKey }) {
  const method = FUNDING_METHODS[methodKey];

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">You&apos;re funding</p>
          {methodKey === "virtual" && (
            <Badge className="h-6 border-0 bg-warning/15 px-2.5 text-warning">Awaiting KYC</Badge>
          )}
        </div>
        <p className="mt-1 text-3xl font-light tabular-nums">{formatNaira(amount ?? 0)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Via {method.label.toLowerCase()}</p>
      </div>

      <dl className="space-y-2.5 border-t border-border pt-4">
        {method.rows.map(({ label, value, canCopy }) => (
          <SummaryRow
            key={label}
            label={label}
            value={
              <span className="block text-right">
                {value}
                {canCopy && <CopyButton value={value} />}
              </span>
            }
          />
        ))}
      </dl>

      <p className="text-xs/5 text-muted-foreground">
        {method.note} Wallet updates after provider confirmation. Payment details remain protected.
      </p>

      <Button className="h-11 w-full rounded-full" disabled={!method.confirmation || !amount} type="submit">
        {method.actionLabel}
      </Button>
    </Card>
  );
}

export function FundingSection() {
  const form = useForm({
    resolver: zodResolver(fundingFormSchema),
    defaultValues: { amount: 250000, method: "bank" as FundingMethodKey },
    mode: "onTouched",
  });
  const amount = useWatch({ control: form.control, name: "amount" });
  const methodKey = useWatch({ control: form.control, name: "method" });
  return (
    <form
      noValidate
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"
      onSubmit={form.handleSubmit(({ method }) => {
        const message = FUNDING_METHODS[method].confirmation;
        if (message) toast.success(message);
      })}
    >
      <Controller
        control={form.control}
        name="amount"
        render={({ field, fieldState }) => (
          <FundingDetailsCard
            amount={field.value}
            onAmountChange={field.onChange}
            methodKey={methodKey}
            onMethodChange={(value) => form.setValue("method", value, { shouldValidate: true })}
            error={fieldState.error?.message}
          />
        )}
      />
      <FundingSummaryCard amount={amount} methodKey={methodKey} />
    </form>
  );
}
