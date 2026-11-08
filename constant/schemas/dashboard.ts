import { z } from "zod";

import { kycStatusSchema } from "../onboarding";
import { amountSchema, timestampSchema } from "./common";
import { transactionSchema } from "./finance";

// Mirrors the mobile `ChartRange` enum; the values double as keys of `portfolioHistory`.
export const chartRangeSchema = z.enum(["oneMonth", "threeMonths", "sixMonths", "oneYear"]);

/** Mobile `HomeDashboard` (GET /dashboard). Portfolio history points are in millions of naira. */
export const homeDashboardSchema = z.object({
  firstName: z.string().min(1),
  kycStatus: kycStatusSchema,
  walletBalance: amountSchema,
  portfolioValue: amountSchema,
  accruedYield: amountSchema,
  activeInvestments: z.number().int().nonnegative(),
  averageYield: z.number().finite().nonnegative(),
  nextPayout: timestampSchema.nullable(),
  unreadNotifications: z.number().int().nonnegative().default(0),
  portfolioHistory: z.partialRecord(chartRangeSchema, z.array(z.number().finite())),
  recentTransactions: z.array(transactionSchema),
});

export type ChartRange = z.infer<typeof chartRangeSchema>;
export type HomeDashboard = z.infer<typeof homeDashboardSchema>;
