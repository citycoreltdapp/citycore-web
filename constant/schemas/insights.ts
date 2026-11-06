import { z } from "zod";

import { dateSchema, paginatedSchema, paginationQuerySchema, positiveAmountSchema, resourceIdSchema } from "./common";
import { investmentSchema } from "./marketplace";

export const marketRegionSchema = z.enum(["all", "lagos", "abuja"]);
export const marketPeriodSchema = z.enum(["ytd", "6m"]);
export const marketInsightsQuerySchema = z.object({
  region: marketRegionSchema.default("all"),
  period: marketPeriodSchema.default("ytd"),
});
export const marketHistoryPointSchema = z.object({
  month: z.string().min(1),
  lagos: z.number().finite(),
  abuja: z.number().finite(),
});
export const marketObservationSchema = z.object({
  date: dateSchema,
  region: z.enum(["lagos", "abuja"]),
  signal: z.number().finite(),
  kind: z.enum(["observed", "projected"]),
  uncertaintyPoints: z.number().finite().nonnegative().nullable(),
});
export const marketInsightSchema = z.object({
  id: resourceIdSchema,
  title: z.string().min(1),
  category: z.string().min(1),
  summary: z.string(),
  body: z.string(),
  publishedAt: dateSchema,
  source: z.string().min(1),
});
export const marketInsightsResponseSchema = z.object({
  asOf: dateSchema,
  illustrative: z.boolean(),
  observations: z.array(marketObservationSchema),
  insights: z.array(marketInsightSchema),
});
export const recommendationPreferencesFormSchema = z.object({
  budget: z
    .string()
    .regex(/^\d+$/, "Choose a budget")
    .refine((v) => Number(v) > 0 && Number.isSafeInteger(Number(v)), "Choose a valid budget"),
  horizon: z.string().refine((v) => ["12", "18"].includes(v), "Choose an investment horizon"),
  risk: z.string().refine((v) => ["conservative", "balanced", "growth"].includes(v), "Choose a risk appetite"),
  location: z.string().refine((v) => ["all", "Lagos", "Abuja"].includes(v), "Choose a location"),
  portfolio: z.boolean(),
});
export const recommendationPreferencesSchema = z.object({
  budget: positiveAmountSchema,
  horizon: z.union([z.literal(12), z.literal(18)]),
  risk: z.enum(["conservative", "balanced", "growth"]),
  location: z.enum(["all", "Lagos", "Abuja"]),
  portfolio: z.boolean(),
});
export const recommendationPreferencesRequestSchema = recommendationPreferencesFormSchema.transform((value, ctx) => {
  const result = recommendationPreferencesSchema.safeParse({
    ...value,
    budget: Number(value.budget),
    horizon: Number(value.horizon),
  });
  if (!result.success) {
    for (const issue of result.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
    return z.NEVER;
  }
  return result.data;
});
export const recommendationSchema = z.object({
  investment: investmentSchema,
  explanation: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]).nullable(),
});
export const recommendationsResponseSchema = z.object({
  id: resourceIdSchema,
  preferences: recommendationPreferencesSchema,
  recommendations: z.array(recommendationSchema),
  illustrative: z.boolean(),
});
export const recommendationRecordSchema = z.object({
  id: resourceIdSchema,
  date: z.string().min(1),
  snapshot: z.string().min(1),
  recommendation: z.string().min(1),
  outcome: z.string().min(1),
});
export const recommendationHistoryQuerySchema = paginationQuerySchema.extend({
  saved: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export const recommendationHistoryResponseSchema = paginatedSchema(recommendationRecordSchema);
export const updateRecommendationRequestSchema = z.strictObject({ outcome: z.enum(["saved", "dismissed", "viewed"]) });
export const marketQuestionFormSchema = z.object({
  question: z.string().trim().min(1, "Enter a market question").max(500),
});
export type Preferences = z.input<typeof recommendationPreferencesFormSchema>;
export type RecommendationPreferences = z.output<typeof recommendationPreferencesRequestSchema>;
export type RecommendationRecord = z.infer<typeof recommendationRecordSchema>;
export type MarketHistoryPoint = z.infer<typeof marketHistoryPointSchema>;
