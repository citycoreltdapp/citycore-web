import { z } from "zod";

import { amountSchema } from "./common";

const text = z.string().trim().min(1, "This field is required").max(2000);
const amount = amountSchema.max(1000000000);
export const platformOperationSchema = z.enum(["funding", "property", "withdrawal", "electricity", "airtime"]);
export const platformMatrixChangeSchema = z
  .object({
    operation: platformOperationSchema,
    fee: amount,
    perTransaction: amount,
    dailyLimit: amount,
  })
  .refine((v) => v.dailyLimit >= v.perTransaction, {
    path: ["dailyLimit"],
    message: "Daily limit must cover the per-transaction limit",
  });
const windowTime = z.iso.datetime({ local: true, precision: -1 });
export const adminPlatformStateSchema = z
  .object({
    matrix: z
      .array(
        z.object({
          operation: platformOperationSchema,
          label: text,
          fee: amount,
          perTransaction: amount.nullable(),
          dailyLimit: amount.nullable(),
          eligibility: text,
        })
      )
      .length(5),
    currency: z.literal("NGN"),
    timezone: z.literal("Africa/Lagos"),
    dateFormat: z.enum(["DD MMM YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
    environment: z.literal("sandbox"),
    maintenance: z.boolean(),
    windowStart: windowTime,
    windowEnd: windowTime,
    headline: text,
    message: text,
    reason: text,
    reference: text.max(80),
    approver: z.enum(["staff-nneka", "staff-amaka"]),
    reviewed: z.boolean(),
    status: z.enum(["draft", "pending"]),
  })
  .refine((v) => v.windowEnd > v.windowStart, {
    path: ["windowEnd"],
    message: "Maintenance must end after it starts",
  })
  .refine(
    (v) =>
      v.matrix.every(
        (row) => row.perTransaction === null || row.dailyLimit === null || row.dailyLimit >= row.perTransaction
      ),
    {
      path: ["matrix"],
      message: "Daily limits must cover per-transaction limits",
    }
  )
  .refine((v) => v.status !== "pending" || v.reviewed, {
    path: ["reviewed"],
    message: "Review the fee impact and investor-facing notices before submitting",
  });
export type PlatformState = z.infer<typeof adminPlatformStateSchema>;
export type MatrixChange = z.infer<typeof platformMatrixChangeSchema>;
