import { z } from "zod";

import { amountSchema, resourceIdSchema, timestampSchema } from "./common";

// Mirrors the mobile app's referral models (features/referrals/models/referral.dart).
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;
export const referralCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(REFERRAL_CODE_PATTERN, "Enter a valid referral code");

export const referralPlanSchema = z.object({
  id: resourceIdSchema,
  name: z.string().min(1),
  commissionPercent: z.number().finite().min(0).max(100),
  tenureMonths: z.number().int().positive(),
  annualRoiPercent: z.number().finite().nonnegative(),
  commissionTerms: z.string().min(1),
});
export const referrerSchema = z.object({ code: referralCodeSchema, name: z.string().min(1) });
export const downlineSchema = z.object({
  id: resourceIdSchema,
  name: z.string().min(1),
  joined: timestampSchema,
  hasInvested: z.boolean(),
});
export const earningStatusSchema = z.enum(["pending", "paid"]);
export const referralEarningSchema = z.object({
  id: resourceIdSchema,
  title: z.string().min(1),
  /** Set on commissions; `null` on the investor's own returns. */
  downlineId: resourceIdSchema.nullable(),
  packageName: z.string().min(1),
  amount: amountSchema,
  date: timestampSchema,
  status: earningStatusSchema,
});
export const referralDashboardResponseSchema = z.object({
  code: referralCodeSchema,
  downlines: z.array(downlineSchema),
  commissions: z.array(referralEarningSchema),
  investorReturns: z.array(referralEarningSchema),
});
// The server rejects the investor's own code and unknown codes with an apiError message.
export const resolveReferralCodeRequestSchema = z.strictObject({ code: referralCodeSchema });
export const resolveReferralCodeResponseSchema = referrerSchema;

export type ReferralPlan = z.infer<typeof referralPlanSchema>;
export type Referrer = z.infer<typeof referrerSchema>;
export type Downline = z.infer<typeof downlineSchema>;
export type EarningStatus = z.infer<typeof earningStatusSchema>;
export type ReferralEarning = z.infer<typeof referralEarningSchema>;
export type ReferralDashboard = z.infer<typeof referralDashboardResponseSchema>;
