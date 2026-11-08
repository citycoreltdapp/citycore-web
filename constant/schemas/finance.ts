import { z } from "zod";

import {
  amountSchema,
  idempotencyKeySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
  transactionPinSchema,
} from "./common";

// Mirrors features/home/models/transaction.dart and features/wallet/models/wallet.dart in the mobile app.
export const MINIMUM_CARD_FUNDING = 1000;
export const MINIMUM_WITHDRAWAL = 1000;

export const transactionTypeSchema = z.enum(["deposit", "withdrawal", "investment", "payout", "commission"]);
export const transactionStatusSchema = z.enum(["successful", "pending", "failed"]);
export const transactionSchema = z.object({
  id: resourceIdSchema,
  title: z.string().min(1),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  /** Signed: credits are positive, debits negative. */
  amount: z
    .number()
    .finite()
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, "Use at most two decimal places"),
  date: timestampSchema,
});
// GET /wallet/transactions returns a plain array, newest first.
export const transactionListResponseSchema = z.array(transactionSchema);

export const bankAccountSchema = z.object({
  bankName: z.string().min(1),
  accountNumber: z.string().regex(/^\d{10}$/, "Your account number must be 10 digits"),
  accountName: z.string().trim().min(1, "Enter the account holder name"),
});
export const walletSchema = z.object({
  balance: amountSchema,
  pendingWithdrawals: amountSchema.default(0),
  /** The investor's dedicated account; bank transfers to it fund the wallet. */
  fundingAccount: bankAccountSchema,
  /** `null` until the investor adds one; withdrawals need it. */
  payoutAccount: bankAccountSchema.nullable(),
});

// POST /wallet/withdraw → Transaction. Mobile sends { amount, pin }.
export const withdrawRequestSchema = z.strictObject({
  amount: positiveAmountSchema.refine((value) => value >= MINIMUM_WITHDRAWAL, "Below the minimum withdrawal"),
  pin: transactionPinSchema,
  // Web additions, optional so the mobile body stays valid.
  authenticatorCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  idempotencyKey: idempotencyKeySchema.optional(),
});
// POST /wallet/fund/card → Transaction. Bank transfers to the funding account need no request.
export const fundWithCardRequestSchema = z.strictObject({
  amount: positiveAmountSchema.refine((value) => value >= MINIMUM_CARD_FUNDING, "Below the minimum top-up"),
  idempotencyKey: idempotencyKeySchema.optional(),
});
// Mobile's savePayoutAccount({ account, pin }); not on an endpoint in the app yet.
export const savePayoutAccountRequestSchema = z.strictObject({
  account: bankAccountSchema,
  pin: transactionPinSchema,
});

export const fundingMethodSchema = z.enum(["bank", "card"]);
export const fundingFormSchema = z
  .object({ amount: positiveAmountSchema, method: fundingMethodSchema })
  .refine((value) => value.method === "bank" || value.amount >= MINIMUM_CARD_FUNDING, {
    path: ["amount"],
    message: `Minimum top-up is ₦${MINIMUM_CARD_FUNDING.toLocaleString("en-NG")}`,
  });

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type BankAccount = z.infer<typeof bankAccountSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type WithdrawRequest = z.infer<typeof withdrawRequestSchema>;
export type FundingFormValues = z.input<typeof fundingFormSchema>;
