import { NIGERIAN_LGAS } from "@/constant/nigerian-lgas";
import { z } from "zod";

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

const requiredFile = (label: string) =>
  z
    .instanceof(File)
    .nullable()
    .refine((file) => file !== null, `${label} is required`);

export const NIN_PATTERN = /^\d{11}$/;

/** The NIN record fills these. They're shown read-only, so they're only ever set from a lookup. */
export const identitySchema = z.object({
  nin: z.string().trim().regex(NIN_PATTERN, "NIN must be 11 digits"),
  fullName: z.string().min(1, "Find your details with your NIN first"),
  dateOfBirth: z.string().min(1),
  phone: z.string().min(1),
  residentialAddress: required("Address"),
  cityOfResidence: required("City"),
  stateOfResidence: required("State"),
  lgaOfResidence: required("Local government area"),
});

export const selfieSchema = z.object({ selfie: requiredFile("A selfie") });

export const addressProofSchema = z.object({
  utilityBill: requiredFile("A utility bill"),
  confirmed: z.boolean().refine(Boolean, "Confirm your details before submitting"),
});

export const onboardingSchema = identitySchema.extend(selfieSchema.shape).extend(addressProofSchema.shape);

/** What the form holds while it's being filled in, so a file can still be empty. */
export type OnboardingFormData = z.input<typeof onboardingSchema>;

export const ONBOARDING_DEFAULT_VALUES: OnboardingFormData = {
  nin: "",
  fullName: "",
  dateOfBirth: "",
  phone: "",
  residentialAddress: "",
  cityOfResidence: "",
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
