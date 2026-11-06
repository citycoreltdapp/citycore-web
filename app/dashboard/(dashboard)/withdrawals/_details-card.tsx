"use client";

import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AVAILABLE_BALANCE,
  BANK_ACCOUNTS,
  TRANSFER_FEE,
  VERIFIED_ACCOUNT_NAME,
  type WithdrawalFormData,
  formatNaira,
} from "@/constant/withdrawal";
import { BankIcon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

const MAX_AMOUNT = AVAILABLE_BALANCE - TRANSFER_FEE;
const QUICK_AMOUNTS = [
  { label: formatNaira(50_000), value: 50_000 },
  { label: formatNaira(100_000), value: 100_000 },
  { label: formatNaira(500_000), value: 500_000 },
  { label: "Max", value: MAX_AMOUNT },
];

export function WithdrawalDetailsCard() {
  const { control, setValue } = useFormContext<WithdrawalFormData>();
  const amount = useWatch({ control, name: "amount" });

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-3 p-5">
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <NumberField
              {...field}
              id="withdrawal-amount"
              label="Amount to withdraw"
              prefix={<span className="text-3xl font-light text-foreground">₦</span>}
              error={fieldState.error?.message}
              labelClassName="text-base font-semibold"
              groupClassName="h-18 rounded-xl bg-muted/40 pl-2 dark:bg-muted/40"
              inputClassName="h-full text-4xl font-light tabular-nums md:text-4xl"
            />
          )}
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map(({ label, value }) => (
            <Button
              key={label}
              type="button"
              variant={amount === value ? "default" : "outline"}
              className="h-8 rounded-full px-3 text-xs tabular-nums"
              aria-pressed={amount === value}
              onClick={() => setValue("amount", value, { shouldValidate: true, shouldTouch: true, shouldDirty: true })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name="bankAccount"
        render={({ field }) => (
          <div className="flex flex-col gap-3 border-t border-border p-5">
            <h2 id="bank-account-label" className="text-base font-semibold">
              Send to
            </h2>
            <RadioGroup
              aria-labelledby="bank-account-label"
              value={field.value}
              onValueChange={field.onChange}
              className="sm:grid-cols-2"
            >
              {BANK_ACCOUNTS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <HugeiconsIcon icon={BankIcon} aria-hidden className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{label}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <HugeiconsIcon
                        icon={CheckmarkBadge01Icon}
                        aria-hidden
                        className="size-3.5 shrink-0 text-success"
                      />
                      <span className="truncate">Verified · {VERIFIED_ACCOUNT_NAME}</span>
                    </span>
                  </span>
                  <RadioGroupItem value={value} />
                </label>
              ))}
            </RadioGroup>
          </div>
        )}
      />
    </Card>
  );
}
