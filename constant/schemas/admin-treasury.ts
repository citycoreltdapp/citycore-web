import { z } from "zod";

import {
  accrualBasisSchema,
  amountSchema,
  paginatedSchema,
  paginationQuerySchema,
  payoutFrequencySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
} from "./common";
import { transactionStatusSchema } from "./finance";
import { holdingStatusSchema } from "./portfolio";

const recordedReason = z.string().trim().min(15, "Record a reason of at least 15 characters").max(2000);
const operationAmount = positiveAmountSchema.refine((v) => v <= 1_000_000_000, "Maximum preview amount is ₦1 billion");
const percent = z
  .number()
  .finite()
  .min(0)
  .max(100)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, "Use at most two decimal places");
const date = z.iso.date({ error: "Select a valid date" });
/**
 * A payout run. Rate, payout frequency and accrual basis come from each investment's terms, and withholding from
 * platform tax settings, so they aren't entered here.
 */
export const returnScheduleFormSchema = z
  .object({
    propertyId: z.union([z.literal("all"), resourceIdSchema]),
    periodStart: date,
    periodEnd: date,
    creditDate: date,
    reason: recordedReason,
  })
  .refine((v) => v.periodEnd >= v.periodStart, { path: ["periodEnd"], message: "Accrual end must follow its start" })
  .refine((v) => v.creditDate > v.periodEnd, {
    path: ["creditDate"],
    message: "Credit date must follow the accrual period",
  });
export const dividendGroupSchema = z
  .object({
    id: resourceIdSchema,
    name: z.string(),
    /** Units held by investors; the payout is shared across them pro rata. */
    units: z.number().int().positive(),
    principal: amountSchema,
    annualRate: percent,
    basis: accrualBasisSchema,
    frequency: payoutFrequencySchema,
    gross: amountSchema,
    tax: amountSchema,
    net: amountSchema,
  })
  .refine((v) => Math.round(v.gross * 100) === Math.round(v.tax * 100) + Math.round(v.net * 100), {
    path: ["net"],
    message: "Gross must equal tax plus net",
  });
export const dividendBatchPreviewSchema = z.object({
  id: resourceIdSchema,
  groups: z.array(dividendGroupSchema),
  preparedBy: resourceIdSchema,
  duplicateCheck: z.enum(["clear", "duplicate", "unknown"]),
  fundingStatus: z.enum(["pending", "verified", "insufficient"]),
  version: z.number().int().nonnegative(),
});
export const independentBatchRequestSchema = z
  .object({
    batchId: resourceIdSchema,
    checkerId: resourceIdSchema,
    requestedBy: resourceIdSchema,
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
    reason: recordedReason,
  })
  .strict()
  .refine((v) => v.checkerId !== v.requestedBy, {
    path: ["checkerId"],
    message: "The maker cannot approve their own batch",
  });
export const maturityFormSchema = z.object({
  releaseDate: date,
  evidenceReference: z.string().trim().min(5, "Enter a settlement evidence reference").max(200),
  reason: recordedReason,
});
export const accrualOverrideFormSchema = z
  .object({
    reference: z.string().trim().min(3).max(128),
    existing: amountSchema,
    proposed: operationAmount,
    reason: recordedReason,
    evidenceReference: z.string().trim().min(5, "Enter an evidence reference").max(200),
    checkerId: resourceIdSchema,
  })
  .refine((v) => v.existing !== v.proposed, {
    path: ["proposed"],
    message: "Proposed accrual must differ from the original",
  });
export const treasuryAccountSchema = z.object({
  id: resourceIdSchema,
  name: z.string(),
  destination: z.string(),
  balance: amountSchema,
  ownership: z.enum(["platform", "investors-restricted", "investor-collections", "settlement-receivable"]),
  state: z.string(),
});
export const adminWithdrawalSchema = z.object({
  id: resourceIdSchema,
  investorId: resourceIdSchema,
  name: z.string(),
  bankLast4: z.string().regex(/^\d{4}$/),
  amount: operationAmount,
  fee: z.literal(0),
  status: transactionStatusSchema,
  risk: z.enum(["new-device", "velocity", "clear"]),
  kycVerified: z.boolean(),
  bankVerified: z.boolean(),
  version: z.number().int().nonnegative(),
});
export const withdrawalRiskFormSchema = z.object({
  decision: z.enum(["hold", "escalate", "clear-for-checker"]),
  reason: recordedReason,
  identityReviewed: z.literal(true, { error: "Confirm you reviewed identity and ownership evidence" }),
});
export const adminWithdrawalBatchRequestSchema = independentBatchRequestSchema
  .safeExtend({ withdrawalIds: z.array(resourceIdSchema).min(1).max(100) })
  .refine((v) => new Set(v.withdrawalIds).size === v.withdrawalIds.length, {
    path: ["withdrawalIds"],
    message: "Duplicate withdrawal reference",
  });
export const manualLedgerFormSchema = z.object({
  accountId: z.enum(["operating"]),
  direction: z.enum(["debit", "credit"]),
  amount: operationAmount,
  counterAccount: z.enum(["bank-charges", "fee-revenue"]),
  memo: recordedReason,
  supportingReference: z.string().trim().min(5, "Enter a supporting reference").max(200),
  checkerId: resourceIdSchema,
});
export const settlementStatusSchema = z.enum(["unknown", "pending", "settled", "confirmed-not-settled"]);
export const settlementRetryRequestSchema = z
  .object({
    reference: resourceIdSchema,
    originalIdempotencyKey: resourceIdSchema,
    status: settlementStatusSchema,
    duplicateCheck: z.literal("clear"),
    reason: recordedReason,
  })
  .strict()
  .refine((v) => v.status === "confirmed-not-settled", {
    path: ["status"],
    message: "Query the provider and confirm non-settlement before retrying",
  });
export const disbursementHistorySchema = z.object({
  id: resourceIdSchema,
  type: z.enum(["dividend", "principal"]),
  scheduledDate: date,
  gross: amountSchema,
  net: amountSchema,
  status: transactionStatusSchema,
  holdingStatus: holdingStatusSchema,
});
export const adminTreasuryQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["all", "pending", "held", "settled"]).default("all"),
});
export const adminWithdrawalListResponseSchema = paginatedSchema(adminWithdrawalSchema);
export const adminTreasuryResponseSchema = z.object({
  accounts: z.array(treasuryAccountSchema),
  withdrawals: z.array(adminWithdrawalSchema),
  history: z.array(disbursementHistorySchema),
});
export const bankingConfigFormSchema = z
  .object({
    environment: z.literal("sandbox"),
    endpoint: z
      .url()
      .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS endpoint")
      .refine((v) => {
        const url = new URL(v);
        return !url.username && !url.password && !url.search && !url.hash;
      }, "Use a base URL without credentials, query or fragment"),
    clientId: z.string().trim().min(3).max(100),
    tenant: z.string().trim().min(2).max(100),
    timeoutSeconds: z.number().int().min(5).max(120),
    reason: recordedReason,
  })
  .strict();
export const bankingConfigRequestSchema = bankingConfigFormSchema
  .extend({ version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict();
export const ledgerMappingSchema = z
  .object({
    id: resourceIdSchema,
    event: z.string(),
    debitAccount: z.string(),
    creditAccount: z.string(),
    state: z.literal("draft"),
  })
  .refine((v) => v.debitAccount !== v.creditAccount, {
    path: ["creditAccount"],
    message: "Debit and credit accounts must differ",
  });
export const postingPreviewFormSchema = z.object({
  reference: z.string().trim().min(3).max(128),
  amount: operationAmount,
});
export const bankingRetryRowSchema = z.object({
  id: resourceIdSchema,
  operation: z.string(),
  failure: z.string(),
  nextStep: z.string(),
  state: z.enum(["blocked", "review-before-retry"]),
  originalReference: resourceIdSchema,
  idempotencyKey: resourceIdSchema,
});
export const bankingIntegrationResponseSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  state: z.enum(["unconfigured", "pending-approval", "connected"]),
  lastSyncAt: timestampSchema.nullable(),
  remoteBalance: amountSchema.nullable(),
  mappings: z.array(ledgerMappingSchema),
  retryQueue: z.array(bankingRetryRowSchema),
});
export type ReturnScheduleForm = z.infer<typeof returnScheduleFormSchema>;
export type DividendGroup = z.infer<typeof dividendGroupSchema>;
export type AdminWithdrawal = z.infer<typeof adminWithdrawalSchema>;
export type ManualLedgerForm = z.infer<typeof manualLedgerFormSchema>;
export type BankingConfigForm = z.infer<typeof bankingConfigFormSchema>;

export const returnScheduleRequestSchema = returnScheduleFormSchema
  .safeExtend({ version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict();
export const maturityReleaseRequestSchema = maturityFormSchema
  .extend({
    batchId: resourceIdSchema,
    checkerId: resourceIdSchema,
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const accrualOverrideRequestSchema = z
  .object({
    reference: resourceIdSchema,
    proposed: operationAmount,
    reason: recordedReason,
    evidenceReference: z.string().trim().min(5, "Enter an evidence reference").max(200),
    checkerId: resourceIdSchema,
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const withdrawalRiskRequestSchema = withdrawalRiskFormSchema
  .extend({ withdrawalId: resourceIdSchema, version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict();
export const manualLedgerRequestSchema = manualLedgerFormSchema
  .extend({ requestedBy: resourceIdSchema, version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict()
  .refine((v) => v.requestedBy !== v.checkerId, { path: ["checkerId"], message: "Choose an independent checker" });
