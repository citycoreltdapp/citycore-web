import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const newPassword = z.string().min(8, "Password must be at least 8 characters");

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
  // `when` keeps this running while other fields are still invalid, since errors now show field by field.
  params: { path: ["confirmPassword"], message: "Passwords don't match", when: () => true },
};

export const signUpSchema = z
  .object({
    referrer: z.string().trim().max(64, "Referrer is too long"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
    terms: z.boolean().refine(Boolean, "Please accept the terms to continue"),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

export const forgotPasswordSchema = z.object({ email });

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Invalid OTP. Please enter a valid OTP."),
});

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.params);

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
