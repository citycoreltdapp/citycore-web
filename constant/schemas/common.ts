import { z } from "zod";

export const resourceIdSchema = z.string().trim().min(1).max(128);
export const dateSchema = z.iso.date();
export const timestampSchema = z.iso.datetime({ offset: true });
export const currencySchema = z.enum(["NGN", "USD", "EUR", "GBP"]);
// Amounts use major currency units, matching the UI. The server owns balances, fees and settlement math.
export const amountSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER / 100)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, "Use at most two decimal places");
export const positiveAmountSchema = amountSchema.refine((value) => value > 0, "Enter an amount greater than zero");
export const unitsSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const searchSchema = z.string().trim().max(200);
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export const dateRangeSchema = z
  .object({ from: dateSchema.optional(), to: dateSchema.optional() })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ["to"],
    message: "End date must follow start date",
  });
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
  });
}
export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: resourceIdSchema.optional(),
});
export const mutationResultSchema = z.object({ success: z.literal(true), updatedAt: timestampSchema });
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>;
export type PaginationQuery = z.output<typeof paginationQuerySchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
