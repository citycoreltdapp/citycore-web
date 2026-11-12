import { z } from "zod";

import { accountTypeSchema, signUpSchema } from "../auth";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Password must be at most 72 bytes")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");
const code = z.string().regex(/^\d{6}$/, "Enter the 6 digit code");

export const loginRequestSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(200),
});
export const registerRequestSchema = signUpSchema;
export const emailRequestSchema = z.object({ email });
export const emailCodeRequestSchema = z.object({ email, code });
export const resetPasswordRequestSchema = emailCodeRequestSchema.extend({ newPassword: password });

export const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;

export const userAddressSchema = z.object({
  line1: z.string(),
  line2: z.string().nullish(),
  city: z.string(),
  lga: z.string().nullish(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string().nullish(),
});

export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export const authUserSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  role: z.string(),
  avatar: z.string().nullable(),
  referralCode: z.string().nullable(),
  kycCompleted: z.boolean(),
  accountType: accountTypeSchema,
  phone: z.string().nullish(),
  gender: z.enum(GENDERS).nullish(),
  address: userAddressSchema.nullish(),
  preferences: userPreferencesSchema.nullish(),
});
/** What sign-in, sign-up, email verification and refresh return. The refresh token comes as a cookie. */
export const authSessionSchema = z.object({ user: authUserSchema, accessToken: z.string() });
export const loginCodeSentSchema = z.object({ verificationRequired: z.literal(true), email: z.string() });
export const loginResponseSchema = z.union([authSessionSchema, loginCodeSentSchema]);

export const changePasswordRequestSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const setPasswordRequestSchema = z.object({ newPassword: password });
export const updateProfileRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/)
      .nullable(),
    gender: z.enum(GENDERS).nullable(),
    address: userAddressSchema.nullable(),
    preferences: userPreferencesSchema,
  })
  .partial();

export type LoginRequest = z.input<typeof loginRequestSchema>;
export type RegisterRequest = z.input<typeof registerRequestSchema>;
export type EmailRequest = z.input<typeof emailRequestSchema>;
export type EmailCodeRequest = z.input<typeof emailCodeRequestSchema>;
export type ResetPasswordRequest = z.input<typeof resetPasswordRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type UserAddress = z.infer<typeof userAddressSchema>;
export type ChangePasswordRequest = z.input<typeof changePasswordRequestSchema>;
export type SetPasswordRequest = z.input<typeof setPasswordRequestSchema>;
export type UpdateProfileRequest = z.input<typeof updateProfileRequestSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
