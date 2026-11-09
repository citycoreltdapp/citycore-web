"use client";

import * as React from "react";

import { BankLogo, findBank } from "@/components/primitives/bank-select-field";
import { DataTable } from "@/components/primitives/data-table";
import { NumberField } from "@/components/primitives/number-field";
import { OtpField } from "@/components/primitives/otp-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withdrawRequestSchema } from "@/constant/schemas/finance";
import {
  SETTLEMENT_STEPS,
  WITHDRAWAL_FEE,
  type WithdrawalFormData,
  formatNaira,
  withdrawalDetailsSchema,
  withdrawalSchema,
} from "@/constant/withdrawal";
import { toApi } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckmarkBadge01Icon, LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { TRANSACTIONS, type Transaction } from "../transactions/_data";
import { TRANSACTION_COLUMNS } from "../transactions/_transaction-ui";
import { type BankAccount, WALLET, maskedAccount } from "../wallet/_data";
import { openPayoutAccountModal } from "./_payout-account-modal";

const MAX_AMOUNT = WALLET.balance;
const QUICK_AMOUNTS = [
  { label: formatNaira(50_000), value: 50_000 },
  { label: formatNaira(100_000), value: 100_000 },
  { label: formatNaira(500_000), value: 500_000 },
  { label: "Max", value: MAX_AMOUNT },
];

function WithdrawalDetailsCard({
  payout,
  onPayoutChange,
}: {
  payout: BankAccount | null;
  onPayoutChange: (account: BankAccount) => void;
}) {
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

      <div className="flex flex-col gap-3 border-t border-border p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Send to</h2>
          <button
            type="button"
            onClick={() => openPayoutAccountModal({ current: payout, onSave: onPayoutChange })}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {payout ? "Change" : "Add payout account"}
          </button>
        </div>
        {payout ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <BankLogo
              bank={findBank({ code: payout.bankCode, name: payout.bankName }) ?? { name: payout.bankName, logo: null }}
              className="size-10"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {payout.bankName} · {maskedAccount(payout)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} aria-hidden className="size-3.5 shrink-0 text-success" />
                <span className="truncate">{payout.accountName}</span>
              </span>
            </span>
          </div>
        ) : (
          <p className="rounded-xl bg-warning/15 p-3 text-sm text-warning">Add a payout account first.</p>
        )}
      </div>
    </Card>
  );
}

const COLUMNS: ColumnDef<Transaction, unknown>[] = [
  TRANSACTION_COLUMNS.title,
  TRANSACTION_COLUMNS.reference,
  TRANSACTION_COLUMNS.amount,
  TRANSACTION_COLUMNS.status,
];
const WITHDRAWALS = TRANSACTIONS.filter((transaction) => transaction.type === "withdrawal");

function WithdrawalHistoryCard() {
  return (
    <Card className="rounded-2xl ring-foreground/8">
      <CardHeader className="border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Withdrawal history</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <DataTable
          columns={COLUMNS}
          data={WITHDRAWALS}
          showPagination={false}
          getRowId={(transaction) => transaction.id}
          rowClassName="border-none even:[&>td]:bg-muted"
          emptyMessage="No withdrawals yet."
        />
      </CardContent>
    </Card>
  );
}

function SettlementCard() {
  return (
    <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <h2 className="text-base font-semibold">Settlement tracking</h2>
      <ol className="grid gap-4 sm:grid-cols-3 sm:gap-0">
        {SETTLEMENT_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5">
            <div className="flex items-center sm:w-full">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                {index + 1}
              </span>
              {index < SETTLEMENT_STEPS.length - 1 && (
                <span aria-hidden className="mx-2 hidden h-px flex-1 bg-border sm:block" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-1.5">
              <p className="text-sm font-semibold">{step}</p>

              <Badge className="h-6 rounded-full bg-warning/15 px-2.5 text-warning">Pending</Badge>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const FLUID_SLOT = "h-11 flex-1 size-auto sm:size-auto sm:h-11";

function WithdrawalSummaryCard({
  payout,
  amount,
  totalDebit,
  isReviewable,
  isReviewed,
  canConfirm,
  onReview,
}: {
  payout: BankAccount | null;
  amount: number;
  totalDebit: number;
  isReviewable: boolean;
  isReviewed: boolean;
  canConfirm: boolean;
  onReview: () => void;
}) {
  const { control } = useFormContext<WithdrawalFormData>();

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Recipient receives</p>
          {isReviewed && <Badge className="h-6 border-0 bg-success/15 px-2.5 text-success">Reviewed</Badge>}
        </div>
        <p className="mt-1 text-3xl font-light tabular-nums">{formatNaira(amount)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {payout ? `${payout.accountName} · ${payout.bankName} ${maskedAccount(payout)}` : "No payout account"}
        </p>
      </div>

      <dl className="space-y-2.5 border-t border-border pt-4">
        <SummaryRow label="Withdrawal fee" value={WITHDRAWAL_FEE === 0 ? "Free" : formatNaira(WITHDRAWAL_FEE)} />
        <SummaryRow label="Total wallet debit" value={formatNaira(totalDebit)} />
        <SummaryRow label="Remaining wallet" value={formatNaira(Math.max(WALLET.balance - totalDebit, 0))} />
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

const FORM_SCHEMA = withdrawalSchema(WALLET.balance);
const DETAILS_SCHEMA = withdrawalDetailsSchema(WALLET.balance);

const DEFAULT_VALUES: WithdrawalFormData = {
  amount: 100000,
  pin: "",
  authenticatorCode: "",
};

export default function Client$WithdrawalsPage() {
  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });
  const amount = useWatch({ control: form.control, name: "amount" });
  const [payout, setPayout] = React.useState(WALLET.payoutAccount);

  // A new amount or payout account needs a fresh review.
  const detailsKey = `${amount}:${payout?.bankName}:${payout?.accountNumber}`;
  const [reviewedKey, setReviewedKey] = React.useState<string | null>(null);
  const isReviewed = reviewedKey === detailsKey;

  const isReviewable = !!payout && DETAILS_SCHEMA.safeParse({ amount }).success && !isReviewed;
  const canConfirm = isReviewed && form.formState.isValid;
  const totalDebit = amount ? amount + WITHDRAWAL_FEE : 0;

  React.useEffect(() => {
    if (isReviewed) {
      form.setFocus("pin");
    } else {
      form.resetField("pin");
      form.resetField("authenticatorCode");
    }
  }, [isReviewed, form]);

  const confirmWithdrawal = ({ amount, pin, authenticatorCode }: WithdrawalFormData) => {
    toApi(withdrawRequestSchema, {
      amount,
      pin,
      authenticatorCode: authenticatorCode || undefined,
      idempotencyKey: crypto.randomUUID(),
    });
    toast.success(`${formatNaira(amount)} is on its way to ${payout?.bankName}.`);
    form.reset();
    setReviewedKey(null);
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Withdraw Funds</h1>
          <p className="text-sm text-muted-foreground">
            Withdrawals go to your payout account. Free, with a minimum of ₦1,000.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Available balance</p>
          <p className="text-xl font-semibold tabular-nums">{formatNaira(WALLET.balance)}</p>
        </div>
      </header>

      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (canConfirm) form.handleSubmit(confirmWithdrawal)(event);
          }}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]"
        >
          <WithdrawalDetailsCard
            payout={payout}
            onPayoutChange={(account) => {
              setPayout(account);
              toast.success(`Withdrawals now go to ${account.bankName} ${maskedAccount(account)}.`);
            }}
          />
          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <WithdrawalSummaryCard
              payout={payout}
              amount={amount ?? 0}
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

      <WithdrawalHistoryCard />
    </>
  );
}
