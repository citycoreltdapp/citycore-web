import { z } from "zod";

import {
  amountSchema,
  dateSchema,
  paginatedSchema,
  paginationQuerySchema,
  positiveAmountSchema,
  resourceIdSchema,
  unitsSchema,
} from "./common";

export const holdingStatusSchema = z.enum(["active", "matured", "pending"]);
export const holdingSchema = z
  .object({
    id: resourceIdSchema,
    investmentId: resourceIdSchema,
    principal: positiveAmountSchema,
    accruedYield: amountSchema,
    units: unitsSchema,
    elapsedMonths: z.number().int().nonnegative(),
    tenure: z.number().int().positive(),
    status: holdingStatusSchema,
    allocatedAt: dateSchema,
    maturityDate: dateSchema,
  })
  .refine((v) => v.allocatedAt <= v.maturityDate, {
    path: ["maturityDate"],
    message: "Maturity must follow allocation",
  });
export const holdingListQuerySchema = paginationQuerySchema.extend({
  status: holdingStatusSchema.optional(),
  sort: z.enum(["recent", "oldest"]).default("recent"),
});
export const holdingListResponseSchema = paginatedSchema(holdingSchema);
export const portfolioSummaryResponseSchema = z.object({
  investedPrincipal: amountSchema,
  accruedYield: amountSchema,
  currentValue: amountSchema,
  totalUnits: z.number().int().nonnegative(),
  counts: z.object({
    active: z.number().int().nonnegative(),
    matured: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
  }),
});
export const portfolioHistoryQuerySchema = z.object({ range: z.enum(["1m", "6m", "ytd", "1y", "all"]).default("ytd") });
export const portfolioHistoryResponseSchema = z.array(z.object({ date: dateSchema, value: amountSchema }));
export type Holding = z.infer<typeof holdingSchema>;
export type PortfolioSummary = z.infer<typeof portfolioSummaryResponseSchema>;
