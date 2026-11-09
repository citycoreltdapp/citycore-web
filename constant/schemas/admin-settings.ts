import { z } from "zod";

import { amountSchema, resourceIdSchema, timestampSchema } from "./common";

export const adminPersonalSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d ()-]{7,25}$/, "Enter a valid phone number"),
  country: z.string().length(2),
  state: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(250),
});
export const adminKinSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  relationship: z.enum(["sibling", "spouse", "parent", "child", "other"]),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d ()-]{7,25}$/),
  address: z.string().trim().min(5).max(250),
});
export const adminProfilePreferencesSchema = z.object({
  receipts: z.boolean(),
  securityAlerts: z.literal(true),
  investmentUpdates: z.boolean(),
  promotions: z.boolean(),
});
export const adminPersonalStateSchema = z.object({
  personal: adminPersonalSchema,
  kin: adminKinSchema.nullable(),
  preferences: adminProfilePreferencesSchema,
});
export const adminPinFormSchema = z
  .object({ pin: z.string().regex(/^\d{4}$/, "Enter a 4-digit PIN"), confirmPin: z.string().regex(/^\d{4}$/) })
  .refine((v) => v.pin === v.confirmPin, { path: ["confirmPin"], message: "PINs must match" });
export const notificationChannelSchema = z.object({
  activity: z.boolean(),
  communications: z.boolean(),
  meetups: z.boolean(),
});
export const adminNotificationPreferencesSchema = z.object({
  email: notificationChannelSchema,
  sms: notificationChannelSchema,
  push: notificationChannelSchema,
  news: notificationChannelSchema,
  buzz: notificationChannelSchema,
  updates: notificationChannelSchema,
});
const limitAmount = amountSchema.refine((v) => v <= 10000000, "Limit cannot exceed ₦10,000,000");
export const adminPaymentLimitsSchema = z
  .object({
    cashWithdrawal: limitAmount,
    privateTransaction: limitAmount,
    onlinePayment: limitAmount,
    storePurchase: limitAmount,
    onlinePurchase: limitAmount,
    zipTransfer: limitAmount,
  })
  .refine((v) => Object.values(v).every((amount) => amount <= 10000000), {
    message: "Preview limits cannot exceed ₦10,000,000",
  });
/** Platform tax rules applied when returns are paid. Each payout batch reads the current rate. */
export const adminTaxSettingsSchema = z.object({
  withholdingRate: z
    .number()
    .finite()
    .min(0)
    .max(100)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, "Use at most two decimal places"),
});
export type AdminTaxSettings = z.infer<typeof adminTaxSettingsSchema>;
export const updateAdminSettingsRequestSchema = z
  .object({
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
    personal: adminPersonalSchema.optional(),
    kin: adminKinSchema.nullable().optional(),
    preferences: adminProfilePreferencesSchema.optional(),
  })
  .strict()
  .refine((v) => v.personal !== undefined || v.kin !== undefined || v.preferences !== undefined, {
    message: "Supply at least one settings change",
  });
export const adminSessionsResponseSchema = z.array(
  z.object({
    id: resourceIdSchema,
    device: z.string(),
    location: z.string(),
    lastActiveAt: timestampSchema,
    current: z.boolean(),
  })
);
