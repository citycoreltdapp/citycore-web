import { EMPTY_PHONE_NUMBER, isPhoneNumberValid } from "@/lib/phone-number";
import { z } from "zod";

/** The digits after the RC, BN, IT, LP or LLP prefix on a CAC certificate. */
export const REGISTRATION_NUMBER_PATTERN = /^\d{4,8}$/;
/** FIRS TINs read 12345678-0001; newer JTB TINs are 10 digits. */
export const TIN_PATTERN = /^(\d{8}-?\d{4}|\d{10})$/;
export const ACCOUNT_NUMBER_PATTERN = /^\d{10}$/;

export const companyTypeSchema = z.enum(["limited", "businessName", "trustees", "limitedPartnership", "llp"]);
export type CompanyType = z.infer<typeof companyTypeSchema>;

export const COMPANY_TYPES: {
  value: CompanyType;
  label: string;
  prefix: string;
  hint: string;
  /** Dojah's `company_type` for the CAC and TIN lookups. */
  dojahType: string;
}[] = [
  { value: "limited", label: "Limited company", prefix: "RC", hint: "Ltd, Plc", dojahType: "COMPANY" },
  {
    value: "businessName",
    label: "Business name",
    prefix: "BN",
    hint: "Sole or partnership",
    dojahType: "BUSINESS_NAME",
  },
  {
    value: "trustees",
    label: "Incorporated trustees",
    prefix: "IT",
    hint: "NGO, foundation",
    dojahType: "INCORPORATED_TRUSTEES",
  },
  {
    value: "limitedPartnership",
    label: "Limited partnership",
    prefix: "LP",
    hint: "General and limited partners",
    dojahType: "LIMITED_PARTNERSHIP",
  },
  {
    value: "llp",
    label: "Limited liability partnership",
    prefix: "LLP",
    hint: "Partners with limited liability",
    dojahType: "LIMITED_LIABILITY_PARTNERSHIP",
  },
];

export const companyTypePrefix = (type: CompanyType) => COMPANY_TYPES.find((t) => t.value === type)?.prefix ?? "RC";

export const cacRecordSchema = z.object({
  registrationNumber: z.string(),
  companyType: companyTypeSchema,
  companyName: z.string().min(1),
  registeredOn: z.date().nullable(),
  registeredAddress: z.string().nullable(),
  tin: z.string().nullable(),
  people: z.array(z.object({ fullName: z.string(), role: z.string() })),
});
export type CacRecord = z.infer<typeof cacRecordSchema>;

type Ctx = z.RefinementCtx;

const OPERATING_ADDRESS_FIELDS = [
  ["operatingAddress", "Address"],
  ["operatingCity", "City"],
  ["operatingState", "State"],
  ["operatingLga", "Local government area"],
] as const;

const requireOperatingAddress = (
  data: { operatesAtRegisteredAddress: boolean } & Record<(typeof OPERATING_ADDRESS_FIELDS)[number][0], string>,
  ctx: Ctx
) => {
  if (data.operatesAtRegisteredAddress) return;
  for (const [path, label] of OPERATING_ADDRESS_FIELDS) {
    if (!data[path].trim()) ctx.addIssue({ code: "custom", path: [path], message: `${label} is required` });
  }
};

const requireTin = (data: { company: CacRecord | null; tin: string }, ctx: Ctx) => {
  if (data.company && !data.company.tin && !TIN_PATTERN.test(data.tin.trim())) {
    ctx.addIssue({ code: "custom", path: ["tin"], message: "Enter a valid TIN, such as 12345678-0001" });
  }
};

const companyFields = {
  companyType: companyTypeSchema,
  companyLogo: z.instanceof(File).nullable(),
  registrationNumber: z
    .string()
    .trim()
    .regex(REGISTRATION_NUMBER_PATTERN, "Enter the 4 to 8 digit number on your certificate"),
  // The registration number locks once `company` is found, so the two can't drift apart.
  company: cacRecordSchema.nullable().refine((v) => v !== null, "Find your company to continue"),
  /** Only typed when the lookup found no TIN. */
  tin: z.string().trim(),
  businessEmail: z.string().trim().pipe(z.email("Enter a valid email address")),
  businessPhone: z
    .object({ number: z.string(), countryCode: z.string() })
    .refine((value) => value.number.trim() !== "", "Business phone is required")
    .refine((value) => !value.number.trim() || isPhoneNumberValid(value), "Enter a valid phone number"),
  operatesAtRegisteredAddress: z.boolean(),
  operatingAddress: z.string(),
  operatingCity: z.string(),
  operatingState: z.string(),
  operatingLga: z.string(),
};

export const companySchema = z.object(companyFields).superRefine((data, ctx) => {
  requireOperatingAddress(data, ctx);
  requireTin(data, ctx);
});

// The CAC lookup already proves the company exists, so the only paper asked for is proof of address.
const addressProofFields = {
  addressProof: z.instanceof(File).nullable(),
};

export const addressProofSchema = z.object(addressProofFields);

export const ID_TYPES = ["nin", "bvn"] as const;
export type IdType = (typeof ID_TYPES)[number];

const authorisationFields = {
  /** The person completing this, picked by name from the CAC record. */
  signatoryName: z.string().trim().min(2, "Enter your full name"),
  signatoryUnlisted: z.boolean(),
  authorisationLetter: z.instanceof(File).nullable(),
  signatoryIdType: z.enum(ID_TYPES),
  signatoryIdNumber: z.string(),
  /** The name on their NIN or BVN record, set only once it matches the CAC name. */
  signatoryVerifiedName: z
    .string()
    .nullable()
    .refine((v) => v !== null, "Verify your ID to continue"),
  bankName: z.string(),
  bankCode: z.string().optional(),
  accountNumber: z
    .string()
    .refine((v) => v === "" || ACCOUNT_NUMBER_PATTERN.test(v), "Account number must be 10 digits"),
  accountName: z.string().nullable(),
  confirmed: z.boolean().refine(Boolean, "Confirm the details before submitting"),
};

const requireCheckedPayout = (
  data: { bankName: string; accountNumber: string; accountName: string | null },
  ctx: Ctx
) => {
  if ((data.bankName || data.accountNumber) && !data.accountName) {
    ctx.addIssue({
      code: "custom",
      path: ["accountNumber"],
      message: "Confirm this account, or clear it and add it later",
    });
  }
};

export const authorisationSchema = z.object(authorisationFields).superRefine(requireCheckedPayout);

export const corporateOnboardingSchema = z
  .object({ ...companyFields, ...addressProofFields, ...authorisationFields })
  .superRefine((data, ctx) => {
    requireOperatingAddress(data, ctx);
    requireTin(data, ctx);
    requireCheckedPayout(data, ctx);
  });

/** What the form holds while it's being filled in, so a file can still be empty. */
export type CorporateOnboardingFormData = z.input<typeof corporateOnboardingSchema>;

export const CORPORATE_ONBOARDING_DEFAULT_VALUES: CorporateOnboardingFormData = {
  companyType: "limited",
  companyLogo: null,
  registrationNumber: "",
  company: null,
  tin: "",
  businessEmail: "",
  businessPhone: EMPTY_PHONE_NUMBER,
  operatesAtRegisteredAddress: true,
  operatingAddress: "",
  operatingCity: "",
  operatingState: "",
  operatingLga: "",
  addressProof: null,
  signatoryName: "",
  signatoryUnlisted: false,
  authorisationLetter: null,
  signatoryIdType: "nin",
  signatoryIdNumber: "",
  signatoryVerifiedName: null,
  bankName: "",
  bankCode: undefined,
  accountNumber: "",
  accountName: null,
  confirmed: false,
};

export const CORPORATE_ONBOARDING_STEPS = [
  {
    title: "Company details",
    description: "Your CAC record and contacts",
    schema: companySchema,
    fields: Object.keys(companyFields) as (keyof typeof companyFields)[],
  },
  {
    title: "Proof of address",
    description: "A recent utility bill",
    schema: addressProofSchema,
    fields: Object.keys(addressProofFields) as (keyof typeof addressProofFields)[],
  },
  {
    title: "Authorisation",
    description: "Your ID and payout account",
    schema: authorisationSchema,
    fields: Object.keys(authorisationFields) as (keyof typeof authorisationFields)[],
  },
] as const;

export const CORPORATE_DOCUMENT_UPLOAD = {
  accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "application/pdf": [".pdf"] },
  maxSize: 10 * 1024 * 1024,
  rejectedMessage: "Upload a JPEG, PNG or PDF up to 10 MB.",
};

export const COMPANY_LOGO_UPLOAD = {
  accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
  maxSize: 5 * 1024 * 1024,
  rejectedMessage: "Use a JPEG, PNG or WebP image up to 5 MB.",
};
