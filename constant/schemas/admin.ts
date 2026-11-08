import { z } from "zod";

export const adminRangeSchema = z.enum(["15d", "30d", "90d"]);
export const adminDashboardQuerySchema = z.object({ range: adminRangeSchema.default("15d") });

export const adminStatToneSchema = z.enum(["neutral", "warning", "info", "negative"]);
export const adminStatSchema = z.object({
  title: z.string(),
  amount: z.string(),
  change: z.string(),
  tone: adminStatToneSchema,
});

export const adminTransactionOverviewPointSchema = z.object({
  month: z.string(),
  volume: z.number().nonnegative(),
  trend: z.number().nonnegative(),
  average: z.number().nonnegative(),
});
export const adminIncomeExpensePointSchema = z.object({
  week: z.string(),
  income: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
});
export const adminUsersByCountrySchema = z.object({
  code: z.string().length(2),
  country: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  users: z.number().int().nonnegative(),
});

export const adminLatestTransactionSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  medium: z.string(),
  amount: z.string(),
});

export const adminDashboardResponseSchema = z.object({
  stats: z.array(adminStatSchema),
  transactionOverview: z.array(adminTransactionOverviewPointSchema),
  incomeAndExpenses: z.array(adminIncomeExpensePointSchema),
  latestTransactions: z.array(adminLatestTransactionSchema),
  usersByCountry: z.array(adminUsersByCountrySchema),
});

export type AdminRange = z.infer<typeof adminRangeSchema>;
export type AdminStat = z.infer<typeof adminStatSchema>;
export type AdminStatTone = z.infer<typeof adminStatToneSchema>;
export type AdminTransactionOverviewPoint = z.infer<typeof adminTransactionOverviewPointSchema>;
export type AdminIncomeExpensePoint = z.infer<typeof adminIncomeExpensePointSchema>;
export type AdminUsersByCountry = z.infer<typeof adminUsersByCountrySchema>;
