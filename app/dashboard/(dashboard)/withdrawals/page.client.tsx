"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  AVAILABLE_BALANCE,
  BANK_ACCOUNTS,
  TRANSFER_FEE,
  type WithdrawalFormData,
  formatNaira,
  withdrawalDetailsSchema,
  withdrawalSchema,
} from "@/constant/withdrawal";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { WithdrawalDetailsCard } from "./_details-card";
import { SettlementCard } from "./_settlement-card";
import { WithdrawalSummaryCard } from "./_summary-card";
import { YourCreditsCard } from "./_your-credits-card";

const DEFAULT_VALUES: WithdrawalFormData = {
  bankAccount: BANK_ACCOUNTS[0].value,
  amount: 100000,
  pin: "",
  authenticatorCode: "",
};

export function Client$WithdrawalsPage() {
  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });
  const [bankAccount, amount] = useWatch({ control: form.control, name: ["bankAccount", "amount"] });

  // A review only counts for what was reviewed, so changing the amount or account asks for a new one.
  const detailsKey = `${bankAccount}:${amount}`;
  const [reviewedKey, setReviewedKey] = React.useState<string | null>(null);
  const isReviewed = reviewedKey === detailsKey;

  const isReviewable = withdrawalDetailsSchema.safeParse({ bankAccount, amount }).success && !isReviewed;
  const canConfirm = isReviewed && form.formState.isValid;
  const totalDebit = amount ? amount + TRANSFER_FEE : 0;

  // A PIN only counts for the withdrawal it was typed for, so editing the details wipes it.
  React.useEffect(() => {
    if (isReviewed) {
      form.setFocus("pin");
    } else {
      form.resetField("pin");
      form.resetField("authenticatorCode");
    }
  }, [isReviewed, form]);

  const confirmWithdrawal = (data: WithdrawalFormData) => {
    // ponytail: no backend yet, send this to the withdrawal API. Never log it, since it holds the PIN.
    toast.success(`Withdrawal of ${formatNaira(data.amount)} submitted.`);
    form.reset();
    setReviewedKey(null);
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Withdraw Funds</h1>
          <p className="text-sm text-muted-foreground">
            Send funds to a verified local bank with secure transaction confirmation.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Available wallet</p>
          <p className="text-xl font-semibold tabular-nums">{formatNaira(AVAILABLE_BALANCE)}</p>
        </div>
      </header>

      <FormProvider {...form}>
        <form
          noValidate
          // Pressing Enter in an earlier field mustn't submit before the review and PIN are done.
          onSubmit={(event) => {
            event.preventDefault();
            if (canConfirm) form.handleSubmit(confirmWithdrawal)(event);
          }}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]"
        >
          <WithdrawalDetailsCard />
          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <WithdrawalSummaryCard
              amount={amount ?? 0}
              bankAccount={bankAccount}
              totalDebit={totalDebit}
              isReviewable={isReviewable}
              isReviewed={isReviewed}
              canConfirm={canConfirm}
              onReview={() => setReviewedKey(detailsKey)}
            />
          </aside>
          <SettlementCard />
        </form>
      </FormProvider>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Credit Overview</h2>
        <Button nativeButton={false} className="h-10 rounded-full px-4" render={<Link href="/wallet" />}>
          <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
          Fund Wallet
        </Button>
      </div>

      <YourCreditsCard />
    </>
  );
}
