import { z } from "zod";

import {
  amountSchema,
  currencySchema,
  paginatedSchema,
  paginationQuerySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
  unitsSchema,
} from "./common";

export const investmentSchema = z
  .object({
    id: resourceIdSchema,
    name: z.string().min(1),
    location: z.string().min(1),
    image: z.string().min(1),
    annualRoi: z.number().finite().nonnegative(),
    tenure: z.number().int().positive(),
    unitPrice: positiveAmountSchema,
    totalUnits: unitsSchema,
    allocatedUnits: z.number().int().nonnegative(),
  })
  .refine((value) => value.allocatedUnits <= value.totalUnits, {
    path: ["allocatedUnits"],
    message: "Allocation exceeds the total offering",
  });
export const investmentListQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().max(200).optional(),
    location: z.string().trim().max(100).optional(),
    minRoi: z.coerce.number().finite().nonnegative().optional(),
    maxRoi: z.coerce.number().finite().nonnegative().optional(),
    tenure: z.coerce.number().int().positive().optional(),
    minUnitPrice: z.coerce.number().finite().nonnegative().optional(),
    maxUnitPrice: z.coerce.number().finite().nonnegative().optional(),
    sort: z.enum(["recent", "oldest", "price-asc", "price-desc"]).default("recent"),
  })
  .refine((v) => v.minUnitPrice === undefined || v.maxUnitPrice === undefined || v.minUnitPrice <= v.maxUnitPrice, {
    path: ["maxUnitPrice"],
    message: "Maximum price must not be below minimum price",
  })
  .refine((v) => v.minRoi === undefined || v.maxRoi === undefined || v.minRoi <= v.maxRoi, {
    path: ["maxRoi"],
    message: "Maximum ROI must not be below minimum ROI",
  });
export const investmentParamsSchema = z.object({ id: resourceIdSchema });
export const investmentListResponseSchema = paginatedSchema(investmentSchema);
export const investmentDocumentSchema = z.object({
  id: resourceIdSchema,
  investmentId: resourceIdSchema,
  kind: z.enum(["prospectus", "agreement", "brochure", "risk"]),
  version: z.string().min(1),
  url: z.url(),
  publishedAt: timestampSchema,
});
export const investmentDetailResponseSchema = z.object({
  investment: investmentSchema,
  documents: z.array(investmentDocumentSchema),
});
export const investmentQuoteRequestSchema = z.strictObject({ investmentId: resourceIdSchema, units: unitsSchema });
export const investmentQuoteResponseSchema = z.object({
  id: resourceIdSchema,
  investmentId: resourceIdSchema,
  units: unitsSchema,
  currency: currencySchema,
  unitPrice: positiveAmountSchema,
  principal: positiveAmountSchema,
  purchaseFee: amountSchema,
  totalDebit: positiveAmountSchema,
  projectedReturn: amountSchema,
  projectedMaturity: positiveAmountSchema,
  availableUnits: z.number().int().nonnegative(),
  expiresAt: timestampSchema,
  agreementVersion: z.string().min(1),
});
export const agreementFormSchema = z.object({
  risks: z.literal(true, { error: "Please acknowledge the investment risks." }),
  exit: z.literal(true, { error: "Please acknowledge the exit terms." }),
  agreement: z.literal(true, { error: "Please accept the agreement." }),
  name: z.string().trim().min(2, "Enter your full legal name.").max(150, "Your name is too long."),
});
// Submit the quote ID, never client-calculated amounts. Recheck availability, balance and agreement version on the server.
export const purchaseInvestmentRequestSchema = z.strictObject({
  quoteId: resourceIdSchema,
  idempotencyKey: z.uuid(),
  agreementVersion: z.string().min(1),
  consent: agreementFormSchema,
});
export const purchaseInvestmentResponseSchema = z.object({
  id: resourceIdSchema,
  reference: z.string().min(1),
  investmentId: resourceIdSchema,
  units: unitsSchema,
  status: z.enum(["pending", "confirmed", "rejected"]),
  createdAt: timestampSchema,
  receiptUrl: z.url().nullable(),
  agreementUrl: z.url().nullable(),
});
export type Investment = z.infer<typeof investmentSchema>;
export type AgreementFormValues = z.input<typeof agreementFormSchema>;
export type InvestmentListQuery = z.output<typeof investmentListQuerySchema>;
export type InvestmentQuote = z.infer<typeof investmentQuoteResponseSchema>;
export type PurchaseInvestmentRequest = z.infer<typeof purchaseInvestmentRequestSchema>;
