import { NIGERIAN_LGAS } from "@/constant/nigerian-lgas";
import { z } from "zod";

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

const requiredFile = (label: string) =>
  z
    .instanceof(File)
    .nullable()
    .refine((file) => file !== null, `${label} is required`);

export const NIN_PATTERN = /^\d{11}$/;

// Mirrors the mobile `KycStatus` enum; the API sends these camelCase values as-is.
export const kycStatusSchema = z.enum(["notStarted", "pending", "verified", "actionRequired"]);
export type KycStatus = z.infer<typeof kycStatusSchema>;

const ninSchema = z.string().trim().regex(NIN_PATTERN, "NIN must be 11 digits");

/** Mobile `NinIdentity`: the record returned for a NIN. Shown read-only, so it's only ever set from a lookup. */
export const ninIdentitySchema = z.object({
  nin: ninSchema,
  firstName: z.string().min(1),
  surname: z.string().min(1),
  dateOfBirth: z.iso.date(),
  phone: z.string().min(1),
});
export type NinIdentity = z.infer<typeof ninIdentitySchema>;
export const ninLookupRequestSchema = z.object({ nin: ninSchema });

// The NIN field locks once `identity` is found, so the two can't drift apart.
export const identitySchema = z.object({
  nin: ninSchema,
  identity: ninIdentitySchema.nullable().refine((v) => v !== null, "Find your identity details to continue"),
  address: required("Address"),
  city: required("City"),
  stateOfResidence: required("State"),
  lgaOfResidence: required("Local government area"),
});

export const selfieSchema = z.object({ selfie: requiredFile("A selfie") });

export const addressProofSchema = z.object({
  utilityBill: requiredFile("A utility bill"),
  confirmed: z.boolean().refine(Boolean, "Confirm your details before submitting"),
});

export const onboardingSchema = identitySchema.extend(selfieSchema.shape).extend(addressProofSchema.shape);

/** Web-only: what the web posts once verification is complete. Mobile keeps this draft locally for now. */
export const kycSubmissionRequestSchema = z.object({
  nin: ninSchema,
  address: required("Address"),
  city: required("City"),
  stateOfResidence: required("State"),
  lgaOfResidence: required("Local government area"),
  selfie: z.instanceof(File),
  utilityBill: z.instanceof(File),
});

/** What the form holds while it's being filled in, so a file can still be empty. */
export type OnboardingFormData = z.input<typeof onboardingSchema>;

export const ONBOARDING_DEFAULT_VALUES: OnboardingFormData = {
  nin: "",
  identity: null,
  address: "",
  city: "",
  stateOfResidence: "",
  lgaOfResidence: "",
  selfie: null,
  utilityBill: null,
  confirmed: false,
};

export const ONBOARDING_STEPS = [
  {
    title: "Identity & address",
    description: "Your NIN and where you live",
    schema: identitySchema,
    fields: identitySchema.keyof().options,
  },
  {
    title: "Your selfie",
    description: "A clear photo of your face",
    schema: selfieSchema,
    fields: selfieSchema.keyof().options,
  },
  {
    title: "Utility bill",
    description: "Proof of your address",
    schema: addressProofSchema,
    fields: addressProofSchema.keyof().options,
  },
] as const;

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export const NIGERIAN_STATE_OPTIONS = toOptions(Object.keys(NIGERIAN_LGAS));

export const getLgaOptions = (state: string) => toOptions(NIGERIAN_LGAS[state] ?? []);

export const SELFIE_UPLOAD = {
  accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
  maxSize: 10 * 1024 * 1024,
  rejectedMessage: "Use a JPEG, PNG or WebP photo up to 10 MB.",
};

export const UTILITY_BILL_UPLOAD = {
  accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "application/pdf": [".pdf"] },
  maxSize: 10 * 1024 * 1024,
  description: "Electricity, water or waste bill showing your address · JPEG, PNG or PDF up to 10 MB.",
  rejectedMessage: "Upload a JPEG, PNG or PDF up to 10 MB.",
};
