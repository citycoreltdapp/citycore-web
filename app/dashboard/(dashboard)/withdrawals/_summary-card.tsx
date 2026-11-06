"use client";

import { OtpField } from "@/components/primitives/otp-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AVAILABLE_BALANCE,
  BANK_ACCOUNTS,
  TRANSFER_FEE,
  VERIFIED_ACCOUNT_NAME,
  type WithdrawalFormData,
  formatNaira,
} from "@/constant/withdrawal";
import { LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useFormContext } from "react-hook-form";

import { SummaryRow } from "../marketplace/_investment-parts";

const FLUID_SLOT = "h-11 flex-1 size-auto sm:size-auto sm:h-11";

export function WithdrawalSummaryCard({
  amount,
  bankAccount,
  totalDebit,
  isReviewable,
  isReviewed,
  canConfirm,
  onReview,
}: {
  amount: number;
  bankAccount: string;
  totalDebit: number;
  isReviewable: boolean;
  isReviewed: boolean;
  canConfirm: boolean;
  onReview: () => void;
}) {
  const { control } = useFormContext<WithdrawalFormData>();
  const bank = BANK_ACCOUNTS.find(({ value }) => value === bankAccount)?.label;

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Recipient receives</p>
          {isReviewed && <Badge className="h-6 border-0 bg-success/15 px-2.5 text-success">Reviewed</Badge>}
        </div>
        <p className="mt-1 text-3xl font-light tabular-nums">{formatNaira(amount)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {VERIFIED_ACCOUNT_NAME} · {bank}
        </p>
      </div>

      <dl className="space-y-2.5 border-t border-border pt-4">
        <SummaryRow label="Transfer fee" value={formatNaira(TRANSFER_FEE)} />
        <SummaryRow label="Total wallet debit" value={formatNaira(totalDebit)} />
        <SummaryRow label="Remaining wallet" value={formatNaira(Math.max(AVAILABLE_BALANCE - totalDebit, 0))} />
      </dl>

      {isReviewed ? (
        <div className="flex animate-in flex-col gap-4 border-t border-border pt-4 duration-300 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
          <Controller
            control={control}
            name="pin"
            render={({ field, fieldState }) => (
              <OtpField
                {...field}
                id="transaction-pin"
                label="4-digit transaction PIN"
                length={4}
                mask
                error={fieldState.error?.message}
                slotClassName={FLUID_SLOT}
              />
            )}
          />
          <Controller
            control={control}
            name="authenticatorCode"
            render={({ field, fieldState }) => (
              <OtpField
                {...field}
                id="authenticator-code"
                label="Authenticator code (if enabled)"
                error={fieldState.error?.message}
                slotClassName={FLUID_SLOT}
              />
            )}
          />
          <p className="flex gap-2 text-xs/5 text-muted-foreground">
            <HugeiconsIcon icon={LockKeyIcon} aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Never share your PIN or 2FA code with anyone, including City Core staff.
          </p>
          {/* Keyed so the click on Review can't land on a button that has just become submit. */}
          <Button key="confirm" type="submit" className="h-11 w-full rounded-full" disabled={!canConfirm}>
            Confirm {formatNaira(totalDebit)} debit
          </Button>
        </div>
      ) : (
        <>
          <p className="rounded-lg bg-warning/15 p-3 text-xs/5 text-warning">
            KYC approval is required. Review the recipient name before confirming.
          </p>
          <Button
            key="review"
            type="button"
            className="h-11 w-full rounded-full"
            disabled={!isReviewable}
            onClick={onReview}
          >
            Review withdrawal
          </Button>
        </>
      )}
    </Card>
  );
}
