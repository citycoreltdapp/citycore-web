import { z } from "zod";

import { resourceIdSchema, timestampSchema } from "./common";

export const legalTemplateFormSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    version: z.string().regex(/^\d+\.\d+$/, "Use a version such as 1.4"),
    body: z.string().trim().min(50).max(15000),
    reason: z.string().trim().min(15).max(2000),
  })
  .refine((v) => ["{{legal_name}}", "{{units}}", "{{principal}}"].every((token) => v.body.includes(token)), {
    path: ["body"],
    message: "Keep the legal_name, units and principal placeholders",
  });
const weight = z.number().finite().min(0).max(100);
export const aiContentFormSchema = z
  .object({
    locationWeight: weight,
    budgetWeight: weight,
    riskWeight: weight,
    tenureWeight: weight,
    confidenceThreshold: z.number().min(0).max(1),
    uncertaintyDisclosure: z.literal(true, { error: "Uncertainty disclosure is mandatory" }),
    assumptions: z.string().trim().min(20).max(3000),
  })
  .refine((v) => Math.abs(v.locationWeight + v.budgetWeight + v.riskWeight + v.tenureWeight - 100) < 0.000001, {
    path: ["tenureWeight"],
    message: "Weights must total 100%",
  });
export const editorialFormSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    source: z.string().trim().min(10).max(500),
    summary: z.string().trim().min(20).max(5000),
    forecastMin: z.number().min(-100).max(100),
    forecastMax: z.number().min(-100).max(100),
    reviewDate: z.iso.date(),
  })
  .refine((v) => v.forecastMin <= v.forecastMax, {
    path: ["forecastMax"],
    message: "Upper forecast must follow lower forecast",
  });
export const adminContentStateSchema = z.object({
  legal: legalTemplateFormSchema,
  model: aiContentFormSchema,
  article: editorialFormSchema,
  prospectusProperty: resourceIdSchema,
});
export const legalReviewRequestSchema = legalTemplateFormSchema
  .safeExtend({
    documentId: resourceIdSchema,
    baseVersion: z.string().min(1),
    checkerId: resourceIdSchema,
    idempotencyKey: z.uuid(),
  })
  .strict();
export const aiContentReviewRequestSchema = aiContentFormSchema
  .safeExtend({ baseVersion: z.string(), checkerId: resourceIdSchema, idempotencyKey: z.uuid() })
  .strict();
export const signedContractAuditSchema = z.object({
  id: resourceIdSchema,
  investorReference: resourceIdSchema,
  acceptedVersion: z.string(),
  acceptedAt: timestampSchema,
  evidenceReference: resourceIdSchema,
});
export const recommendationAuditSchema = z.object({
  id: resourceIdSchema,
  investorReference: resourceIdSchema,
  query: z.string(),
  recommendation: z.string(),
  modelVersion: z.string(),
  context: z.string(),
});
