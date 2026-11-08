import { z } from "zod";

import { transactionPinSchema } from "./schemas/common";
import { MINIMUM_WITHDRAWAL } from "./schemas/finance";

// Withdrawals are free in the app; the server still has to check the balance and fee again.
export const WITHDRAWAL_FEE = 0;

export const SETTLEMENT_STEPS = ["Security checks", "Bank submission", "Settlement"];

export const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-US")}`;

/** Same rules and messages as the app's withdraw screen, for the balance the wallet reports. */
export const withdrawalDetailsSchema = (balance: number) =>
  z.object({
    amount: z
      .number({ error: "Enter an amount" })
      .positive("Enter an amount")
      .min(MINIMUM_WITHDRAWAL, `Minimum withdrawal is ${formatNaira(MINIMUM_WITHDRAWAL)}`)
      .max(balance, "Amount is more than your balance"),
  });

export const withdrawalSchema = (balance: number) =>
  withdrawalDetailsSchema(balance).extend({
    pin: transactionPinSchema,
    // Web-only: the app has no authenticator step yet, so the field is optional on the request.
    authenticatorCode: z.string().regex(/^(\d{6})?$/, "Enter all 6 digits, or leave this empty"),
  });

export type WithdrawalFormData = z.infer<ReturnType<typeof withdrawalSchema>>;
