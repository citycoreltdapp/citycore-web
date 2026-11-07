import { z } from "zod";

import {
  paginatedSchema,
  paginationQuerySchema,
  positiveAmountSchema,
  resourceIdSchema,
  timestampSchema,
} from "./common";
import { investmentSchema } from "./marketplace";

export const propertyImageSchema = z.enum(["golden-estate", "residences", "waterfront", "skyline", "city-lights"]);
export const adminInvestmentStatusSchema = z.enum(["draft", "active", "paused", "pending-review"]);
export const investmentCoverFileSchema = z
  .file()
  .mime(["image/png", "image/jpeg", "image/webp"])
  .max(2 * 1024 * 1024);
export const investmentCoverPreviewSchema = z
  .string()
  .max(2800000)
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, "Use a valid image preview");
export const adminInvestmentFormSchema = z
  .object({
    name: z.string().trim().min(3, "Enter an investment name").max(120),
    location: z.string().trim().min(3, "Enter a location").max(150),
    category: z.enum(["residential", "commercial", "mixed-use"]),
    image: propertyImageSchema,
    coverPreview: investmentCoverPreviewSchema.optional(),
    description: z.string().trim().min(30, "Describe the offering in at least 30 characters").max(5000),
    annualRoi: z.number().finite().min(0).max(100),
    tenure: z.number().int().min(1).max(120),
    unitPrice: positiveAmountSchema,
    totalUnits: z.number().int().min(1).max(10000000),
    minimumUnits: z.number().int().min(1).max(10000000),
    startDate: z.iso.date({ error: "Select a valid start date" }),
    endDate: z.iso.date({ error: "Select a valid end date" }),
    publisherId: resourceIdSchema,
    rightsConfirmed: z.boolean(),
    termsConfirmed: z.boolean(),
  })
  .refine((v) => v.endDate > v.startDate, { path: ["endDate"], message: "End date must be after start date" })
  .refine((v) => v.minimumUnits <= v.totalUnits, {
    path: ["minimumUnits"],
    message: "Minimum allocation exceeds the offering",
  });
export const adminInvestmentSchema = adminInvestmentFormSchema
  .safeExtend({
    id: resourceIdSchema,
    allocatedUnits: z.number().int().nonnegative(),
    status: adminInvestmentStatusSchema,
    version: z.number().int().nonnegative(),
    updatedAt: timestampSchema,
  })
  .refine((v) => v.allocatedUnits <= v.totalUnits, {
    path: ["totalUnits"],
    message: "Total units cannot be below allocated units",
  });
export const publishAdminInvestmentSchema = adminInvestmentFormSchema.safeExtend({
  rightsConfirmed: z.literal(true, { error: "Confirm you have rights to use this cover" }),
  termsConfirmed: z.literal(true, { error: "Confirm the offering terms have been reviewed" }),
});
export const createAdminInvestmentRequestSchema = adminInvestmentFormSchema
  .safeExtend({
    coverPreview: z.never().optional(),
    idempotencyKey: z.uuid(),
    coverAssetId: resourceIdSchema.optional(),
    intent: z.enum(["draft", "review"]),
  })
  .strict()
  .refine((v) => v.intent !== "review" || (v.rightsConfirmed && v.termsConfirmed), {
    path: ["termsConfirmed"],
    message: "Review the cover rights and offering terms before publication",
  });
export const updateAdminInvestmentRequestSchema = createAdminInvestmentRequestSchema.safeExtend({
  version: z.number().int().nonnegative(),
});
export const adminInvestmentQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  status: adminInvestmentStatusSchema.optional(),
  location: z.string().max(150).optional(),
  sort: z.enum(["recent", "name", "price-asc"]).default("recent"),
});
export const adminInvestmentsResponseSchema = paginatedSchema(adminInvestmentSchema);
export const adminInvestmentStatusRequestSchema = z
  .object({
    status: z.enum(["paused", "review"]),
    reason: z.string().trim().min(15).max(2000),
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const adminInvestmentOfferingSchema = investmentSchema;
export type AdminInvestment = z.infer<typeof adminInvestmentSchema>;
export type AdminInvestmentForm = z.infer<typeof adminInvestmentFormSchema>;
