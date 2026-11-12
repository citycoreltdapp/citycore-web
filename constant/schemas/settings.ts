import { isPhoneNumberValid } from "@/lib/phone-number";
import { countries } from "countries-list";
import { z } from "zod";

import { resourceIdSchema as settingsId, timestampSchema as settingsTimestamp } from "./common";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(80),
  lastName: z.string().trim().min(1, "Enter your last name").max(80),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  phone: z
    .object({ number: z.string(), countryCode: z.string() })
    .refine((value) => !value.number.trim() || isPhoneNumberValid(value), "Enter a valid phone number"),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  tagline: z.string().max(500, "Keep your tagline under 500 characters"),
  privacy: z.boolean().refine(Boolean, "Please acknowledge the privacy policy"),
  terms: z.boolean().refine(Boolean, "Please acknowledge the terms and conditions"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
export const addressSchema = z.object({
  country: z
    .string()
    .length(2, "Select your country")
    .refine((value) => Object.hasOwn(countries, value), "Select a supported country"),
  address1: z.string().trim().min(1, "Enter your address").max(200),
  address2: z.string().trim().max(200),
  zip: z.string().trim().min(1, "Enter your postal code").max(20),
});
export type AddressValues = z.infer<typeof addressSchema>;
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "At least 1 lowercase letter (a–z)", test: (value: string) => /[a-z]/.test(value) },
  { label: "At least 1 uppercase letter (A–Z)", test: (value: string) => /[A-Z]/.test(value) },
  { label: "At least 1 number (0–9)", test: (value: string) => /[0-9]/.test(value) },
  { label: "At least 1 special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];
export const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .max(128, "Keep your password under 128 characters")
      .refine(
        (value) => PASSWORD_RULES.every((rule) => rule.test(value)),
        "Your new password must meet all requirements"
      ),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
    when: () => true,
  })
  .refine((value) => value.newPassword !== value.oldPassword, {
    path: ["newPassword"],
    message: "Choose a different password from your current one",
  });

// API contracts use normalized contact details, independently of the phone field's editable form value.

export const photoVisibilitySchema = z.enum(["anyone", "members", "private"]);
export const twoFactorMethodSchema = z.enum(["authenticator", "sms", "email"]);
export const twoFactorSelectionSchema = z.object({ authenticator: z.boolean(), sms: z.boolean(), email: z.boolean() });
export const twoFactorPreferencesFormSchema = twoFactorSelectionSchema.refine(
  (value) => Object.values(value).some(Boolean),
  "Choose at least one verification method"
);
export const updateProfileRequestSchema = z.strictObject({
  firstName: profileSchema.shape.firstName,
  lastName: profileSchema.shape.lastName,
  email: profileSchema.shape.email,
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use an international phone number")
    .nullable(),
  gender: profileSchema.shape.gender,
  tagline: profileSchema.shape.tagline,
});
export const profileResponseSchema = updateProfileRequestSchema.extend({
  id: settingsId,
  photoUrl: z.url().nullable(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  updatedAt: settingsTimestamp,
});
export const updateAddressRequestSchema = addressSchema;
export const addressResponseSchema = addressSchema.extend({ updatedAt: settingsTimestamp });
export const updatePrivacyRequestSchema = z.strictObject({ photoVisibility: photoVisibilitySchema });
export const privacyResponseSchema = updatePrivacyRequestSchema.extend({ updatedAt: settingsTimestamp });
export const changePasswordRequestSchema = z
  .strictObject({ oldPassword: passwordSchema.shape.oldPassword, newPassword: passwordSchema.shape.newPassword })
  .refine((v) => v.oldPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "Choose a different password from your current one",
  });
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
export type Profile = z.infer<typeof profileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type TwoFactorMethod = z.infer<typeof twoFactorMethodSchema>;
export type TwoFactorSelection = z.infer<typeof twoFactorSelectionSchema>;
export type PasswordFormValues = z.input<typeof passwordSchema>;
export type AddressFormValues = z.input<typeof addressSchema>;
