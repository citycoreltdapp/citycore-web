import { z } from "zod";

import { amountSchema, currencySchema, timestampSchema } from "./common";

export const dashboardRangeSchema = z.enum(["1H", "1D", "1W", "1M", "1Y"]);
export const dashboardQuerySchema = z.object({
  range: dashboardRangeSchema.default("1W"),
  currency: currencySchema.default("NGN"),
});
export const dashboardSummaryResponseSchema = z.object({
  firstName: z.string(),
  currency: currencySchema,
  totalIncome: amountSchema,
  totalSpending: amountSchema,
  spendingGoal: amountSchema,
  totalTransactions: z.number().int().nonnegative(),
  updatedAt: timestampSchema,
});
export const dashboardHistoryResponseSchema = z.array(z.object({ period: z.string(), value: z.number().finite() }));
export const dashboardTransactionsResponseSchema = z.array(
  z.object({ id: z.string(), title: z.string(), date: z.string(), medium: z.string(), amount: z.string() })
);
