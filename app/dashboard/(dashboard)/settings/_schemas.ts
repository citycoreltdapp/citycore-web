import { isPhoneNumberValid } from "@/lib/phone-number";
import { z } from "zod";

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
  country: z.string().length(2, "Select your country"),
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
