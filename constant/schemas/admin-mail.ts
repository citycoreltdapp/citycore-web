import { z } from "zod";

import { resourceIdSchema, timestampSchema } from "./common";

export const emailKindSchema = z.enum([
  "welcome",
  "account-created",
  "password-changed",
  "email-changed",
  "account-closed",
  "email-confirmation",
  "password-reset",
  "wallet-funded",
  "investment-started",
  "return-paid",
  "investment-withdrawn",
  "commission-paid",
  "kyc-submitted",
  "kyc-approved",
  "kyc-rejected",
  "ticket-created",
  "ticket-reply",
  "ticket-resolved",
  "birthday",
  "test",
]);
export const emailGroupSchema = z.enum(["account", "codes", "money", "kyc", "helpdesk", "birthday", "staff"]);
export const emailStatusSchema = z.enum(["queued", "sent", "failed", "skipped"]);

export const EMAIL_KIND_META = {
  welcome: { group: "account", label: "Welcome", security: false },
  "account-created": { group: "account", label: "Account created by staff", security: false },
  "password-changed": { group: "account", label: "Password changed", security: true },
  "email-changed": { group: "account", label: "Email changed", security: true },
  "account-closed": { group: "account", label: "Account closed", security: true },
  "email-confirmation": { group: "codes", label: "Email confirmation", security: true },
  "password-reset": { group: "codes", label: "Password reset", security: true },
  "wallet-funded": { group: "money", label: "Wallet funded", security: false },
  "investment-started": { group: "money", label: "Investment started", security: false },
  "return-paid": { group: "money", label: "Return paid", security: false },
  "investment-withdrawn": { group: "money", label: "Investment withdrawn", security: false },
  "commission-paid": { group: "money", label: "Commission paid", security: false },
  "kyc-submitted": { group: "kyc", label: "KYC submitted", security: false },
  "kyc-approved": { group: "kyc", label: "KYC approved", security: false },
  "kyc-rejected": { group: "kyc", label: "KYC rejected", security: false },
  "ticket-created": { group: "helpdesk", label: "Ticket created", security: false },
  "ticket-reply": { group: "helpdesk", label: "Staff reply", security: false },
  "ticket-resolved": { group: "helpdesk", label: "Ticket resolved", security: false },
  birthday: { group: "birthday", label: "Birthday", security: false },
  test: { group: "staff", label: "Test", security: true },
} as const satisfies Record<
  z.infer<typeof emailKindSchema>,
  { group: z.infer<typeof emailGroupSchema>; label: string; security: boolean }
>;

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time");
export const birthdaySettingsSchema = z.object({
  subject: z.string().trim().min(1, "Add a subject").max(200),
  message: z.string().trim().min(1, "Write the birthday message").max(5000),
  sendTime: clock,
  timezone: z.enum(["Africa/Lagos", "Africa/Accra", "UTC"]),
});

const birthdayDay = z.number().int().min(1).max(31);
export const birthdayPersonSchema = z
  .object({
    userId: resourceIdSchema,
    name: z.string().trim().min(1),
    email: z.email(),
    month: z.number().int().min(1).max(12),
    day: birthdayDay,
    emailOptIn: z.boolean(),
  })
  .refine((person) => person.month !== 2 || person.day <= 29, { path: ["day"], message: "February has no such day" })
  .refine((person) => ![4, 6, 9, 11].includes(person.month) || person.day <= 30, {
    path: ["day"],
    message: "That month has 30 days",
  });

export const emailLogSchema = z.object({
  id: resourceIdSchema,
  kind: emailKindSchema,
  userId: resourceIdSchema,
  toName: z.string().trim().min(1),
  toEmail: z.email(),
  status: emailStatusSchema,
  attempts: z.number().int().min(1).max(8),
  createdAt: timestampSchema,
  detail: z.string().max(500),
});

export const emailDeskSchema = z.object({
  settings: birthdaySettingsSchema,
  people: z.array(birthdayPersonSchema),
  log: z.array(emailLogSchema),
});
export type EmailDesk = z.infer<typeof emailDeskSchema>;
export type EmailLogEntry = z.infer<typeof emailLogSchema>;
export type BirthdayPerson = z.infer<typeof birthdayPersonSchema>;
