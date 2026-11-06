import { z } from "zod";

import {
  amountSchema,
  currencySchema,
  dateRangeSchema,
  paginatedSchema,
  paginationQuerySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
} from "./common";

export const fundingMethodSchema = z.enum(["bank", "card", "virtual"]);
export const fundingFormSchema = z.object({ amount: positiveAmountSchema, method: fundingMethodSchema });
export const createFundingRequestSchema = z.strictObject({
  amount: positiveAmountSchema,
  currency: currencySchema,
  method: fundingMethodSchema,
  idempotencyKey: z.uuid(),
});
export const createFundingResponseSchema = z.object({
  id: resourceIdSchema,
  reference: z.string(),
  amount: positiveAmountSchema,
  currency: currencySchema,
  fee: amountSchema,
  status: z.enum(["pending", "confirmed", "failed"]),
  expiresAt: timestampSchema,
  paymentUrl: z.url().nullable(),
});
export const walletBalanceSchema = z.object({
  currency: currencySchema,
  available: amountSchema,
  pending: amountSchema,
});
export const walletResponseSchema = z.object({ balances: z.array(walletBalanceSchema), updatedAt: timestampSchema });
export const walletTransfersQuerySchema = z.object({ period: z.enum(["recent", "1y", "5y"]).default("1y") });
export const walletTransfersResponseSchema = z.array(
  z.object({ month: z.string(), usd: amountSchema, eur: amountSchema })
);
export const transactionStatusSchema = z.enum(["Successful", "Pending", "Cancel"]);
// Display-ready shape used by the current table; normalized amounts also have their own schema below.
export const transactionRowSchema = z.object({
  key: resourceIdSchema,
  title: z.string(),
  date: z.string(),
  invoice: z.string(),
  medium: z.enum(["PayPal", "Visa", "Payoneer"]),
  amount: z.string().min(1),
  status: transactionStatusSchema,
});
export const transactionSchema = z.object({
  id: resourceIdSchema,
  reference: z.string(),
  title: z.string(),
  createdAt: timestampSchema,
  amount: amountSchema,
  direction: z.enum(["credit", "debit"]),
  currency: currencySchema,
  medium: z.string(),
  status: transactionStatusSchema,
});
export const transactionListQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().max(200).optional(),
    status: transactionStatusSchema.optional(),
    currency: currencySchema.optional(),
    sort: z.enum(["recent", "oldest"]).default("recent"),
    from: dateRangeSchema.shape.from,
    to: dateRangeSchema.shape.to,
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { path: ["to"], message: "End date must follow start date" });
export const transactionListResponseSchema = paginatedSchema(transactionSchema);
export const reportQuerySchema = z
  .object({ currency: currencySchema.default("NGN"), from: dateRangeSchema.shape.from, to: dateRangeSchema.shape.to })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { path: ["to"], message: "End date must follow start date" });
export const transactionReportResponseSchema = z.object({
  currency: currencySchema,
  totalBalance: amountSchema,
  totalDeposits: amountSchema,
  totalIncoming: amountSchema,
  totalOutgoing: amountSchema,
  history: z.array(z.object({ date: z.iso.date(), incoming: amountSchema, outgoing: amountSchema })),
});
export const creditStatusSchema = z.enum(["Active", "Pause", "Cancel"]);
export const creditRowSchema = z.object({
  key: resourceIdSchema,
  title: z.string(),
  card: z.string(),
  detail: z.string(),
  detailNote: z.string(),
  balance: amountSchema,
  interest: z.string(),
  status: creditStatusSchema,
});
export const creditListQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(200).optional(),
  status: creditStatusSchema.optional(),
});
export const creditListResponseSchema = paginatedSchema(creditRowSchema);
export const updateCreditRequestSchema = z.strictObject({ status: creditStatusSchema });
export const bankAccountSchema = z.object({
  id: resourceIdSchema,
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  maskedAccountNumber: z.string().min(1),
  verified: z.boolean(),
});
export const bankAccountsResponseSchema = z.array(bankAccountSchema);
export const withdrawalQuoteRequestSchema = z.strictObject({
  bankAccountId: resourceIdSchema,
  amount: positiveAmountSchema,
  currency: currencySchema,
});
export const withdrawalQuoteResponseSchema = z.object({
  id: resourceIdSchema,
  amount: positiveAmountSchema,
  fee: amountSchema,
  totalDebit: positiveAmountSchema,
  expiresAt: timestampSchema,
});
// No hard-coded demo balance here. The live server must check ownership, balance, PIN and verification.
export const createWithdrawalRequestSchema = z.strictObject({
  quoteId: resourceIdSchema,
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN"),
  authenticatorCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  idempotencyKey: z.uuid(),
});
export const withdrawalResponseSchema = z.object({
  id: resourceIdSchema,
  reference: z.string(),
  amount: positiveAmountSchema,
  fee: amountSchema,
  currency: currencySchema,
  status: z.enum(["pending", "processing", "settled", "failed", "cancelled"]),
  createdAt: timestampSchema,
});
export const withdrawalListResponseSchema = paginatedSchema(withdrawalResponseSchema);
export type Transaction = z.infer<typeof transactionRowSchema>;
export type Credit = z.infer<typeof creditRowSchema>;
export type FundingFormValues = z.input<typeof fundingFormSchema>;
export type CreateWithdrawalRequest = z.infer<typeof createWithdrawalRequestSchema>;
