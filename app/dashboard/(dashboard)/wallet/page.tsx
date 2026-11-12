"use client";

import { type ReactNode, Suspense } from "react";

import { DataTable } from "@/components/primitives/data-table";
import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type FundingFormValues,
  MINIMUM_CARD_FUNDING,
  fundingFormSchema,
  transactionListResponseSchema,
  walletSchema,
} from "@/constant/schemas/finance";
import { useMockQuery } from "@/lib/query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddCircleIcon,
  ArrowRight02Icon,
  BankIcon,
  Clock01Icon,
  Copy01Icon,
  CreditCardIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { naira } from "../marketplace/page";
import { TRANSACTIONS, type Transaction } from "../transactions/_data";
import { TRANSACTION_COLUMNS } from "../transactions/_transaction-ui";
import { type BankAccount, WALLET, maskedAccount } from "./_data";

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const DEPOSIT_AMOUNT_ID = "deposit-amount";

type FundingMethodKey = FundingFormValues["method"];

const FUNDING_METHODS = {
  bank: {
    label: "Bank transfer",
    hint: "Reflects in minutes",
    icon: BankIcon,
  },
  card: {
    label: "Debit card",
    hint: `Minimum ₦${MINIMUM_CARD_FUNDING.toLocaleString("en-US")}`,
    icon: CreditCardIcon,
  },
} satisfies Record<FundingMethodKey, { label: string; hint: string; icon: unknown }>;
const METHOD_KEYS = Object.keys(FUNDING_METHODS) as FundingMethodKey[];
const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000];

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-US")}`;

function CopyButton({ value }: { value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Account number copied.");
    } catch {
      toast.error("Couldn't copy the account number. Copy it by hand instead.");
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
  const { data: wallet } = useMockQuery({ key: "wallet", schema: walletSchema, mock: WALLET });

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
        <h2 id="funding-method-label" className="text-base font-semibold">
          Pay with
        </h2>
        <RadioGroup
          aria-labelledby="funding-method-label"
          value={methodKey}
          onValueChange={(next) => onMethodChange(next as FundingMethodKey)}
          className="sm:grid-cols-2"
        >
          {METHOD_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon icon={FUNDING_METHODS[key].icon} aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{FUNDING_METHODS[key].label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {key === "bank" && wallet?.fundingAccount
                    ? `${wallet.fundingAccount.bankName} · reflects in minutes`
                    : FUNDING_METHODS[key].hint}
                </span>
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
  const { data: wallet } = useMockQuery({ key: "wallet", schema: walletSchema, mock: WALLET });
  const account = wallet?.fundingAccount;

  return (
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div>
        <p className="text-xs text-muted-foreground">You&apos;re funding</p>
        <p className="mt-1 text-3xl font-light tabular-nums">{formatNaira(amount ?? 0)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Via {FUNDING_METHODS[methodKey].label.toLowerCase()}</p>
      </div>

      {methodKey === "bank" && account ? (
        <>
          <dl className="space-y-2.5 border-t border-border pt-4">
            <SummaryRow label="Bank" value={account.bankName} />
            <SummaryRow
              label="Account number"
              value={
                <span className="block text-right tabular-nums">
                  {account.accountNumber}
                  <CopyButton value={account.accountNumber} />
                </span>
              }
            />
            <SummaryRow label="Account name" value={account.accountName} />
          </dl>
          <p className="text-xs/5 text-muted-foreground">
            Send money to your dedicated City Core account from any Nigerian bank app. This account is unique to you.
            Transfers from accounts in your name only.
          </p>
        </>
      ) : (
        <>
          <p className="border-t border-border pt-4 text-xs/5 text-muted-foreground">
            Card payments are processed securely by our payment partner. City Core never stores your card details.
          </p>
          <Button className="h-11 w-full rounded-full" disabled={!amount} type="submit">
            Pay {formatNaira(amount ?? 0)}
          </Button>
        </>
      )}
    </Card>
  );
}

function FundingSection() {
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
      onSubmit={form.handleSubmit(() =>
        // ponytail: card funding is a Paystack redirect; it gets its own wallet action.
        toast.info("Card payments aren't connected to a payment partner yet.")
      )}
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

function WalletBalanceCard() {
  const { data: wallet } = useMockQuery({ key: "wallet", schema: walletSchema, mock: WALLET });

  return (
    <Card className="relative gap-6 overflow-hidden rounded-2xl bg-[#121212] px-5 py-5 text-white ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-10 size-52 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative flex items-center gap-2 text-sm text-white/60">
        <HugeiconsIcon icon={Wallet01Icon} aria-hidden className="size-4" />
        Available balance
      </div>
      <p className="relative text-4xl font-light tracking-tight tabular-nums">{naira(wallet?.balance ?? 0)}</p>
      <p className="relative flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-white/70">
        <HugeiconsIcon icon={Clock01Icon} aria-hidden className="size-4 text-warning" />
        {wallet && wallet.pendingWithdrawals > 0
          ? `${naira(wallet.pendingWithdrawals)} pending withdrawal`
          : "No pending withdrawals"}
      </p>
    </Card>
  );
}

function AccountRow({
  icon,
  label,
  account,
  action,
}: {
  icon: IconSvgElement;
  label: string;
  account: BankAccount | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <HugeiconsIcon icon={icon} aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">
          {account ? `${account.bankName} · ${maskedAccount(account)}` : "Required before you can withdraw"}
        </p>
        {account && <p className="truncate text-xs text-muted-foreground">{account.accountName}</p>}
      </div>
      {action}
    </div>
  );
}

function WalletAccountsCard() {
  const { data: wallet } = useMockQuery({ key: "wallet", schema: walletSchema, mock: WALLET });
  const payout = wallet?.payoutAccount ?? null;
  return (
    <Card className="min-w-0 rounded-2xl ring-foreground/8">
      <CardHeader className="border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Accounts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border px-5">
        <AccountRow
          icon={Wallet01Icon}
          label="Funding account · transfers in"
          account={wallet?.fundingAccount ?? null}
        />
        <AccountRow
          icon={BankIcon}
          label={payout ? "Payout account · withdrawals out" : "Add a payout account"}
          account={payout}
          action={
            <Button
              variant="ghost"
              className="h-8 shrink-0 rounded-full px-3 text-sm font-semibold text-primary"
              onClick={() => toast.info("Changing the payout account isn't connected to a backend yet.")}
            >
              {payout ? "Change" : "Add"}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

const COLUMNS: ColumnDef<Transaction, unknown>[] = Object.values(TRANSACTION_COLUMNS);

function RecentTransactionsCard() {
  const { data: transactions } = useMockQuery({
    key: "walletTransactions",
    schema: transactionListResponseSchema,
    mock: TRANSACTIONS,
  });
  const recent = (transactions ?? []).slice(0, 6);

  return (
    <Card className="rounded-2xl ring-foreground/8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Recent transactions</CardTitle>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1.5 text-sm font-medium text-chart-4 underline-offset-4 hover:underline"
        >
          View all {(transactions ?? []).length} transactions
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-5">
        <DataTable
          columns={COLUMNS}
          data={recent}
          showPagination={false}
          getRowId={(transaction) => transaction.id}
          rowClassName="border-none even:[&>td]:bg-muted"
          emptyMessage="No transactions yet. Fund your wallet to get started."
        />
      </CardContent>
    </Card>
  );
}

export default function Client$WalletPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            className="h-10 rounded-full px-4"
            render={<Link href="/dashboard/withdrawals" />}
          >
            Withdraw
          </Button>
          <Button
            className="h-10 rounded-full px-4"
            onClick={() => document.getElementById(DEPOSIT_AMOUNT_ID)?.focus()}
          >
            <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
            Fund wallet
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <WalletBalanceCard />
        <WalletAccountsCard />
      </div>

      <FundingSection />

      <Suspense fallback={<Skeleton className="h-150 rounded-2xl" />}>
        <RecentTransactionsCard />
      </Suspense>
    </>
  );
}
