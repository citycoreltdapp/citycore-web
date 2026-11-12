import { z } from "zod";

import { companyTypeSchema } from "../corporate-onboarding";

const date = z.coerce.date();

export const kycAddressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: z.string().nullable().optional(),
  city: z.string().trim().min(1),
  lga: z.string().nullable().optional(),
  state: z.string().trim().min(1),
  country: z.string().length(2),
});

const fileSchema = z.object({ url: z.string(), mimeType: z.string(), uploadedAt: date });

export const kycIdentitySchema = z.object({
  firstName: z.string().nullable(),
  middleName: z.string().nullable(),
  lastName: z.string().nullable(),
  dateOfBirth: date.nullable(),
  gender: z.enum(["male", "female"]).nullable(),
  phone: z.string().nullable(),
});

export const kycBusinessSchema = z.object({
  companyType: companyTypeSchema,
  registrationNumber: z.string(),
  companyName: z.string(),
  registeredOn: date.nullable(),
  registeredAddress: z.string().nullable(),
  affiliates: z.array(z.object({ fullName: z.string(), role: z.string() })),
  tin: z.string().nullable(),
  tinFromRegistry: z.boolean(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  operatingAddress: kycAddressSchema.nullable(),
  detailsCompletedAt: date.nullable(),
});

export const kycStateSchema = z.looseObject({
  available: z.boolean(),
  status: z.enum(["not_started", "draft", "in_review", "approved", "rejected"]),
  nextStep: z.enum([
    "verify_nin",
    "personal_details",
    "verify_company",
    "company_details",
    "upload_documents",
    "verify_signatory",
    "upload_authorisation",
    "submit",
    "await_review",
    "complete",
  ]),
  editable: z.boolean(),
  nin: z.object({ verified: z.boolean(), last4: z.string().nullable(), lookupsRemaining: z.number() }),
  identity: kycIdentitySchema.nullable(),
  details: z.object({ address: kycAddressSchema }).loose().nullable(),
  business: kycBusinessSchema.nullable(),
  signatory: z
    .object({
      fullName: z.string(),
      role: z.string(),
      onCacRecord: z.boolean(),
      idType: z.enum(["nin", "bvn"]),
      idLast4: z.string(),
      verifiedName: z.string(),
    })
    .nullable(),
  payout: z
    .object({ bankCode: z.string(), bankName: z.string(), accountNumber: z.string(), accountName: z.string() })
    .nullable(),
  documents: z.object({
    selfie: fileSchema.nullable(),
    utilityBill: fileSchema.nullable(),
    authorisationLetter: fileSchema.nullable(),
    companyLogo: fileSchema.nullable(),
  }),
  rejectionReason: z.string().nullable(),
});

export const ninRequestSchema = z.object({ nin: z.string().regex(/^\d{11}$/) });
export const kycDetailsRequestSchema = z.object({ address: kycAddressSchema });
export const businessLookupRequestSchema = z.object({
  companyType: companyTypeSchema,
  registrationNumber: z.string().regex(/^\d{4,8}$/),
});
export const businessDetailsRequestSchema = z.object({
  tin: z.string().optional(),
  email: z.email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  operatingAddress: kycAddressSchema.nullable(),
});
export const signatoryRequestSchema = z.object({
  fullName: z.string().min(2),
  idType: z.enum(["nin", "bvn"]),
  idNumber: z.string().regex(/^\d{11}$/),
});
export const payoutRequestSchema = z.object({
  bankCode: z.string().min(3),
  bankName: z.string().min(2),
  accountNumber: z.string().regex(/^\d{10}$/),
});

export type KycState = z.infer<typeof kycStateSchema>;
export type KycBusiness = z.infer<typeof kycBusinessSchema>;
export type KycAddress = z.input<typeof kycAddressSchema>;
export type BusinessDetailsRequest = z.input<typeof businessDetailsRequestSchema>;
export type SignatoryRequest = z.input<typeof signatoryRequestSchema>;
export type PayoutRequest = z.input<typeof payoutRequestSchema>;
export type BusinessLookupRequest = z.input<typeof businessLookupRequestSchema>;
