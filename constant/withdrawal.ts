import { z } from "zod";

// ponytail: mock figures from the Figma frame. The server must check the balance and fee again when the backend exists.
export const AVAILABLE_BALANCE = 1250000;
export const TRANSFER_FEE = 50;

export const BANK_ACCOUNTS = [
  { value: "demo-2048", label: "Demo Bank •••• 2048" },
  { value: "sandbox-7731", label: "Sandbox MFB •••• 7731" },
];
export const VERIFIED_ACCOUNT_NAME = "Ada Okafor";

export const SETTLEMENT_STEPS = ["Security checks", "Bank submission", "Settlement"];

export const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-US")}`;

export const withdrawalDetailsSchema = z.object({
  bankAccount: z.string().min(1, "Choose a bank account"),
  amount: z
    .number({ error: "Enter an amount" })
    .positive("Enter an amount")
    .max(
      AVAILABLE_BALANCE - TRANSFER_FEE,
      `The most you can withdraw is ${formatNaira(AVAILABLE_BALANCE - TRANSFER_FEE)}`
    ),
});

export const withdrawalSchema = withdrawalDetailsSchema.extend({
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN"),
  authenticatorCode: z.string().regex(/^(\d{6})?$/, "Enter all 6 digits, or leave this empty"),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
