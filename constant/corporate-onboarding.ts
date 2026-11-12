import { EMPTY_PHONE_NUMBER, isPhoneNumberValid } from "@/lib/phone-number";
import { z } from "zod";

import { NIN_PATTERN, requiredFile } from "./onboarding";

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

export const personRoleSchema = z.enum(["director", "shareholder", "both"]);
export type PersonRole = z.infer<typeof personRoleSchema>;

/** What a CAC lookup returns. Shown read-only, so it's only ever set from a lookup. */
export const cacRecordSchema = z.object({
  registrationNumber: z.string(),
  companyType: companyTypeSchema,
  companyName: z.string().min(1),
  registeredOn: z.iso.date(),
  registeredAddress: z.string().min(1),
  /** Looked up from the registration number. Some companies have none linked, so they type it instead. */
  tin: z.string().nullable(),
  /** Who CAC lists against the company. The signatory picks themselves from this list. */
  people: z.array(z.object({ fullName: z.string(), role: personRoleSchema })),
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
  addressProof: requiredFile("Proof of address"),
};

export const addressProofSchema = z.object(addressProofFields);

export const ID_TYPES = ["nin", "bvn"] as const;
export type IdType = (typeof ID_TYPES)[number];

const authorisationFields = {
  /** The person completing this, picked by name from the CAC record. */
  signatoryName: z.string().min(1, "Choose your name from the list"),
  signatoryIdType: z.enum(ID_TYPES),
  signatoryIdNumber: z.string().trim().regex(NIN_PATTERN, "Must be 11 digits"),
  /** The name on their NIN or BVN record, set only once it matches the CAC name. */
  signatoryVerifiedName: z
    .string()
    .nullable()
    .refine((v) => v !== null, "Verify your ID to continue"),
  bankName: z.string().min(1, "Choose the company's bank"),
  bankCode: z.string().optional(),
  accountNumber: z.string().regex(ACCOUNT_NUMBER_PATTERN, "Account number must be 10 digits"),
  /** The name the bank returns, set only once it matches the company. */
  accountName: z
    .string()
    .nullable()
    .refine((v) => v !== null, "Confirm the account name to continue"),
  confirmed: z.boolean().refine(Boolean, "Confirm the details before submitting"),
};

export const authorisationSchema = z.object(authorisationFields);

export const corporateOnboardingSchema = z
  .object({ ...companyFields, ...addressProofFields, ...authorisationFields })
  .superRefine((data, ctx) => {
    requireOperatingAddress(data, ctx);
    requireTin(data, ctx);
  });

/** What the form holds while it's being filled in, so a file can still be empty. */
export type CorporateOnboardingFormData = z.input<typeof corporateOnboardingSchema>;

export const CORPORATE_ONBOARDING_DEFAULT_VALUES: CorporateOnboardingFormData = {
  companyType: "limited",
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
