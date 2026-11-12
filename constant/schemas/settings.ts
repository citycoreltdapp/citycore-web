import { isPhoneNumberValid } from "@/lib/phone-number";
import { countries } from "countries-list";
import { z } from "zod";

import { resourceIdSchema as settingsId, timestampSchema as settingsTimestamp } from "./common";

export const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name").max(50),
    lastName: z.string().trim().min(1, "Enter your last name").max(50),
    phone: z
      .object({ number: z.string(), countryCode: z.string() })
      .refine((value) => !value.number.trim() || isPhoneNumberValid(value), "Enter a valid phone number"),
    gender: z.enum(["male", "female", "prefer_not_to_say"]).nullable(),
  })
  .refine((value) => `${value.firstName} ${value.lastName}`.length <= 100, {
    path: ["lastName"],
    message: "Your full name must be at most 100 characters",
  });
export type ProfileValues = z.infer<typeof profileSchema>;
export const addressSchema = z.object({
  country: z
    .string()
    .length(2, "Select your country")
    .refine((value) => Object.hasOwn(countries, value), "Select a supported country"),
  address1: z.string().trim().min(1, "Enter your address").max(200),
  address2: z.string().trim().max(200),
  city: z.string().trim().min(1, "Enter your city").max(100),
  state: z.string().trim().min(1, "Enter your state").max(100),
  zip: z.string().trim().max(20),
});
export type AddressValues = z.infer<typeof addressSchema>;
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "At least 1 lowercase letter (a–z)", test: (value: string) => /[a-z]/.test(value) },
  { label: "At least 1 uppercase letter (A–Z)", test: (value: string) => /[A-Z]/.test(value) },
  { label: "At least 1 number (0–9)", test: (value: string) => /[0-9]/.test(value) },
  { label: "At least 1 special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];
const newPassword = z
  .string()
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Keep your password under 72 characters")
  .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), "Your new password must meet all requirements");

const passwordsMatch = {
  path: ["confirmPassword"],
  message: "Passwords don't match",
  when: () => true,
};

export const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, passwordsMatch)
  .refine((value) => value.newPassword !== value.oldPassword, {
    path: ["newPassword"],
    message: "Choose a different password from your current one",
  });

export const newPasswordSchema = z
  .object({
    oldPassword: z.string(),
    newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, passwordsMatch);

// API contracts use normalized contact details, independently of the phone field's editable form value.

export const photoVisibilitySchema = z.enum(["anyone", "members", "private"]);
export const twoFactorMethodSchema = z.enum(["authenticator", "sms", "email"]);
export const twoFactorSelectionSchema = z.object({ authenticator: z.boolean(), sms: z.boolean(), email: z.boolean() });
export const twoFactorPreferencesFormSchema = twoFactorSelectionSchema.refine(
  (value) => Object.values(value).some(Boolean),
  "Choose at least one verification method"
);
export const updateAddressRequestSchema = addressSchema;
export const addressResponseSchema = addressSchema.extend({ updatedAt: settingsTimestamp });
export const updatePrivacyRequestSchema = z.strictObject({ photoVisibility: photoVisibilitySchema });
export const privacyResponseSchema = updatePrivacyRequestSchema.extend({ updatedAt: settingsTimestamp });
export const profilePhotoMetadataSchema = z.strictObject({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
});
export const profilePhotoFileSchema = z
  .file()
  .mime(["image/jpeg", "image/png", "image/webp"])
  .max(5 * 1024 * 1024);
export const profilePhotoUploadResponseSchema = z.object({
  uploadId: settingsId,
  uploadUrl: z.url(),
  expiresAt: settingsTimestamp,
});
export const commitProfilePhotoRequestSchema = z.strictObject({ uploadId: settingsId });
export const deleteProfilePhotoRequestSchema = z.strictObject({});
export const verificationCodeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code");
export const twoFactorStatusResponseSchema = z.object({
  methods: z.array(
    z.object({ method: twoFactorMethodSchema, enabled: z.boolean(), verifiedAt: settingsTimestamp.nullable() })
  ),
});
export const startTwoFactorRequestSchema = z.strictObject({
  method: twoFactorMethodSchema,
  password: z.string().min(1),
});
export const startTwoFactorResponseSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("authenticator"),
    challengeId: settingsId,
    expiresAt: settingsTimestamp,
    setupUri: z
      .string()
      .url()
      .refine((uri) => uri.startsWith("otpauth://totp/"), "Expected a TOTP setup URI"),
  }),
  z.object({
    method: z.enum(["sms", "email"]),
    challengeId: settingsId,
    expiresAt: settingsTimestamp,
    maskedDestination: z.string().min(1),
  }),
]);
export const verifyTwoFactorRequestSchema = z.strictObject({ challengeId: settingsId, code: verificationCodeSchema });
export const verifyTwoFactorResponseSchema = z.object({
  method: twoFactorMethodSchema,
  enabled: z.literal(true),
  recoveryCodes: z.array(z.string().min(1)).optional(),
});
export const disableTwoFactorRequestSchema = z.strictObject({
  method: twoFactorMethodSchema,
  password: z.string().min(1),
  code: verificationCodeSchema,
});
export const socialProviderSchema = z.enum(["Apple"]);
export const socialConnectionsResponseSchema = z.array(
  z.object({ provider: socialProviderSchema, connected: z.boolean(), connectedAt: settingsTimestamp.nullable() })
);
export const startSocialConnectionRequestSchema = z.strictObject({ provider: socialProviderSchema });
export const startSocialConnectionResponseSchema = z.object({
  authorizationUrl: z.url(),
  expiresAt: settingsTimestamp,
});
export const deleteAccountFormSchema = z.object({
  confirmation: z.literal("DELETE", { error: "Type DELETE to confirm" }),
});
export const deleteAccountRequestSchema = z.strictObject({
  confirmation: z.literal("DELETE"),
  password: z.string().min(1),
  verificationCode: verificationCodeSchema.optional(),
});
export const deleteAccountResponseSchema = z.object({
  requestId: settingsId,
  status: z.literal("scheduled"),
  requestedAt: settingsTimestamp,
  cancelBefore: settingsTimestamp,
  deleteAfter: settingsTimestamp,
});
export const cancelAccountDeletionRequestSchema = z.strictObject({ requestId: settingsId });
export type TwoFactorMethod = z.infer<typeof twoFactorMethodSchema>;
export type TwoFactorSelection = z.infer<typeof twoFactorSelectionSchema>;
export type PasswordFormValues = z.input<typeof passwordSchema>;
export type AddressFormValues = z.input<typeof addressSchema>;
