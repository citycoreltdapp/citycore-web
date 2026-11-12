"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { BankLogo, BankSelectField, findBank } from "@/components/primitives/bank-select-field";
import { OtpField } from "@/components/primitives/otp-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { transactionPinSchema } from "@/constant/schemas/common";
import { type BankAccount, bankAccountSchema, savePayoutAccountRequestSchema } from "@/constant/schemas/finance";
import { API_ROUTES } from "@/lib/api";
import { useApiMutation } from "@/lib/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const FORM_ID = "payout-account-form";
const formSchema = bankAccountSchema.extend({
  bankName: z.string().min(1, "Choose your bank"),
  pin: transactionPinSchema,
});
type PayoutAccountForm = z.infer<typeof formSchema>;

/** Groups the digits typed so far as 3-3-4 and pads the rest with dots, like a printed account number. */
function accountPreview(digits: string) {
  const padded = digits.padEnd(10, "•");
  return `${padded.slice(0, 3)} ${padded.slice(3, 6)} ${padded.slice(6)}`;
}

function AccountCard({ bankName, bankCode, accountNumber, accountName }: Partial<BankAccount>) {
  const bank = findBank({ code: bankCode, name: bankName });
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#121212] p-5 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-accent/30 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {bank ? (
            <BankLogo bank={bank} className="size-9 bg-white/10 text-white ring-white/10" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-xs">—</span>
          )}
          <span className="truncate text-sm font-semibold">{bankName || "Choose a bank"}</span>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">Payout account</span>
      </div>
      <p className="relative mt-8 font-mono text-2xl tracking-[0.12em] tabular-nums">
        {accountPreview(accountNumber ?? "")}
      </p>
      <p className="relative mt-2 truncate text-sm text-white/60">{accountName || "Account holder name"}</p>
    </div>
  );
}

function PayoutAccountFormBody({
  current,
  onSave,
}: {
  current: BankAccount | null;
  onSave: (account: BankAccount) => void;
}) {
  const form = useForm<PayoutAccountForm>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      bankName: "",
      bankCode: undefined,
      accountNumber: "",
      accountName: current?.accountName ?? "",
      pin: "",
    },
  });
  const draft = useWatch({ control: form.control });
  const saveAccount = useApiMutation({
    path: API_ROUTES.payoutAccount,
    method: "put",
    bodySchema: savePayoutAccountRequestSchema,
    schema: bankAccountSchema,
    mock: (body: { account: BankAccount }) => body.account,
    invalidates: [API_ROUTES.wallet],
  });

  const save = ({ pin, ...account }: PayoutAccountForm) => {
    const sameBank = findBank({ code: current?.bankCode, name: current?.bankName })?.code === account.bankCode;
    if (current && sameBank && current.accountNumber === account.accountNumber) {
      form.setError("accountNumber", { message: "This is already your payout account" });
      return;
    }
    saveAccount.mutate(
      { account, pin },
      {
        onSuccess: (saved) => {
          onSave(saved);
          AppModal.close();
        },
        onError: (error) => {
          form.resetField("pin");
          form.setError("pin", { message: error.message });
        },
      }
    );
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(save)} className="flex flex-col gap-6">
      <AccountCard {...draft} />

      <Controller
        control={form.control}
        name="bankName"
        render={({ field, fieldState }) => (
          <BankSelectField
            id="payout-bank"
            value={findBank({ code: draft.bankCode, name: field.value }) ?? null}
            onChange={(bank) => {
              form.setValue("bankCode", bank?.code);
              field.onChange(bank?.name ?? "");
              field.onBlur();
            }}
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="accountNumber"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              onChange={(value) => field.onChange(value.replace(/\D/g, "").slice(0, 10))}
              id="payout-account-number"
              label="Account number"
              placeholder="10-digit NUBAN"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              helpText={`${field.value.length}/10 digits`}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="accountName"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="payout-account-name"
              label="Account holder name"
              placeholder="As it appears at your bank"
              autoComplete="name"
              helpText="It must match your verified ID."
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4">
        <Controller
          control={form.control}
          name="pin"
          render={({ field, fieldState }) => (
            <OtpField
              {...field}
              id="payout-pin"
              label="Confirm with your transaction PIN"
              length={4}
              mask
              error={fieldState.error?.message}
              slotClassName="h-11 flex-1 size-auto sm:size-auto sm:h-11"
            />
          )}
        />
        <p className="flex gap-2 text-xs/5 text-muted-foreground">
          <HugeiconsIcon icon={LockKeyIcon} aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Withdrawals only go to an account in your own name. Never share your PIN, including with City Core staff.
        </p>
      </div>
    </form>
  );
}

export function openPayoutAccountModal(options: {
  current: BankAccount | null;
  onSave: (account: BankAccount) => void;
}) {
  AppModal.open({
    title: options.current ? "Change payout account" : "Add payout account",
    description: "Where your withdrawals are sent.",
    content: <PayoutAccountFormBody {...options} />,
    footer: (
      <div className="flex w-full justify-end gap-2">
        <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={AppModal.close}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} className="h-10 rounded-full px-5">
          Save account
        </Button>
      </div>
    ),
  });
}
