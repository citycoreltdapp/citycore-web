import { z } from "zod";

import {
  amountSchema,
  dateSchema,
  idempotencyKeySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
  transactionPinSchema,
  unitsSchema,
} from "./common";
import { referralPlanSchema } from "./referrals";

// Mirrors the mobile Property and InvestmentReceipt models (features/market/models/property.dart).
// Enum values are sent as written; Dart reads them with `values.byName`.
export const propertyTypeSchema = z.enum(["residential", "commercial", "mixedUse"]);
export const propertyStatusSchema = z.enum(["open", "fundingSoon", "fullyFunded"]);

export const propertyDocumentSchema = z.object({
  id: resourceIdSchema,
  kind: z.enum(["prospectus", "agreement", "brochure", "risk"]),
  version: z.string().min(1),
  url: z.url(),
  publishedAt: timestampSchema,
});

export const propertySchema = z
  .object({
    id: resourceIdSchema,
    name: z.string().min(1),
    /** Neighbourhood, e.g. "Lekki Phase 1"; the city is separate. */
    location: z.string().min(1),
    city: z.string().min(1),
    type: propertyTypeSchema,
    status: propertyStatusSchema,
    /** Image URLs; the first is the cover. */
    images: z.array(z.string().min(1)),
    unitPrice: positiveAmountSchema,
    /** Target simple annual return, in percent. A referral plan's ROI wins when one is attached. */
    targetRoi: z.number().finite().nonnegative(),
    tenureMonths: z.number().int().positive(),
    totalUnits: unitsSchema,
    unitsSold: z.number().int().nonnegative(),
    minUnits: z.number().int().positive().default(1),
    maxUnits: z.number().int().positive().default(100),
    developer: z.string().min(1),
    completionDate: dateSchema,
    description: z.string().min(1),
    highlights: z.array(z.string().min(1)),
    /** `null` when the package pays no referral commission. */
    referralPlan: referralPlanSchema.nullish(),
    /** Web addition: published offering documents. Mobile ignores it. */
    documents: z.array(propertyDocumentSchema).optional(),
  })
  .refine((value) => value.unitsSold <= value.totalUnits, {
    path: ["unitsSold"],
    message: "Units sold exceed the offering",
  })
  .refine((value) => value.minUnits <= value.maxUnits, {
    path: ["maxUnits"],
    message: "Maximum units must not be below the minimum",
  });

// GET /properties returns a plain array, as the mobile client expects.
export const propertyListResponseSchema = z.array(propertySchema);
export const propertyParamsSchema = z.object({ id: resourceIdSchema });

export const agreementFormSchema = z.object({
  risks: z.literal(true, { error: "Please acknowledge the investment risks." }),
  exit: z.literal(true, { error: "Please acknowledge the exit terms." }),
  agreement: z.literal(true, { error: "Please accept the agreement." }),
  name: z.string().trim().min(2, "Enter your full legal name.").max(150, "Your name is too long."),
  pin: transactionPinSchema,
});

// POST /properties/{id}/invest. The mobile body is { units, pin }; the server prices the units itself.
export const investRequestSchema = z.strictObject({
  units: unitsSchema,
  pin: transactionPinSchema,
  // Web additions, optional so the mobile body stays valid.
  agreementVersion: z.string().min(1).optional(),
  signatureName: z.string().trim().min(2).max(150).optional(),
  idempotencyKey: idempotencyKeySchema.optional(),
});
export const investmentReceiptSchema = z.object({
  reference: z.string().min(1),
  units: unitsSchema,
  amount: amountSchema,
  maturityDate: dateSchema,
});

export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;
export type Property = z.infer<typeof propertySchema>;
export type AgreementFormValues = z.input<typeof agreementFormSchema>;
export type InvestRequest = z.infer<typeof investRequestSchema>;
export type InvestmentReceipt = z.infer<typeof investmentReceiptSchema>;
