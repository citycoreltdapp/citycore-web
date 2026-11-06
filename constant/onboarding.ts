import { NIGERIAN_LGAS } from "@/constant/nigerian-lgas";
import { EMPTY_PHONE_NUMBER, isPhoneNumberValid, phoneNumberToE164 } from "@/lib/phone-number";
import { z } from "zod";

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

const identityNumber = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{11}$/, `${label} must be 11 digits`);

const requiredFile = (label: string) =>
  z
    .instanceof(File)
    .nullable()
    .refine((file) => file !== null, `${label} is required`);

export const personalInfoSchema = z.object({
  surname: required("Surname"),
  firstName: required("First name"),
  otherName: z.string().trim(),
  phoneNumber: z
    .object({ number: z.string(), countryCode: z.string() })
    .refine(isPhoneNumberValid, "Enter a valid phone number")
    .transform(phoneNumberToE164),
  gender: required("Gender"),
  // abort: an empty date skips the check below, which reads the clock and can't run while prerendering.
  dateOfBirth: z.iso
    .date({ error: "Date of birth is required", abort: true })
    .refine((date) => new Date(date) < new Date(), {
      message: "Date of birth must be in the past",
    }),
  stateOfOrigin: required("State of origin"),
  lgaOfOrigin: required("Local government of origin"),
  residentialAddress: required("Residential address"),
  stateOfResidence: required("State of residence"),
  lgaOfResidence: required("Local government of residence"),
  cityOfResidence: required("City of residence"),
});

export const identityVerificationSchema = z.object({
  nin: identityNumber("NIN"),
  bvn: identityNumber("BVN"),
  idCard: requiredFile("A valid ID card"),
  passportPhotograph: requiredFile("A passport photograph"),
});

export const onboardingSchema = personalInfoSchema.extend(identityVerificationSchema.shape);

/** What the form holds while it's being filled in, so a file can still be empty. */
export type OnboardingFormData = z.input<typeof onboardingSchema>;

export const ONBOARDING_DEFAULT_VALUES: OnboardingFormData = {
  surname: "",
  firstName: "",
  otherName: "",
  phoneNumber: EMPTY_PHONE_NUMBER,
  gender: "",
  dateOfBirth: "",
  stateOfOrigin: "",
  lgaOfOrigin: "",
  residentialAddress: "",
  stateOfResidence: "",
  lgaOfResidence: "",
  cityOfResidence: "",
  nin: "",
  bvn: "",
  idCard: null,
  passportPhotograph: null,
};

export const ONBOARDING_STEPS = [
  {
    title: "Personal Info",
    description: "Tell Us About Yourself",
    schema: personalInfoSchema,
    fields: personalInfoSchema.keyof().options,
  },
  {
    title: "Identity Verification",
    description: "Verify Your Identity",
    schema: identityVerificationSchema,
    fields: identityVerificationSchema.keyof().options,
  },
  { title: "Review & Submit", description: "Confirm Your Information", schema: onboardingSchema, fields: [] },
] as const;

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export const GENDER_OPTIONS = toOptions(["Male", "Female"]);

export const NIGERIAN_STATE_OPTIONS = toOptions(Object.keys(NIGERIAN_LGAS));

export const getLgaOptions = (state: string) => toOptions(NIGERIAN_LGAS[state] ?? []);

export const DOCUMENT_UPLOAD = {
  accept: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/pdf": [".pdf"],
    "video/mp4": [".mp4"],
  },
  maxSize: 50 * 1024 * 1024,
  description: "JPEG, PNG, PDF, and MP4 formats, up to 50 MB.",
  rejectedMessage: "Upload a JPEG, PNG, PDF or MP4 file up to 50 MB.",
};
