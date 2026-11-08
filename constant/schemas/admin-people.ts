import { z } from "zod";

import { kycStatusSchema } from "../onboarding";
import {
  amountSchema,
  dateSchema,
  paginatedSchema,
  paginationQuerySchema,
  resourceIdSchema,
  searchSchema,
  timestampSchema,
} from "./common";

export const investorStatusSchema = z.enum(["active", "suspended", "blacklisted"]);
export const staffRoleSchema = z.enum(["super-admin", "compliance", "finance", "property-manager"]);
export const adminInvestorSchema = z.object({
  id: resourceIdSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  joinedAt: dateSchema,
  status: investorStatusSchema,
  kycStatus: kycStatusSchema,
  tier: z.number().int().min(1).max(3),
  investmentCount: z.number().int().nonnegative(),
  principal: amountSchema,
  yield: amountSchema,
  balance: amountSchema,
  pendingWithdrawals: amountSchema,
  units: z.number().int().nonnegative(),
});
export const staffMemberSchema = z.object({
  id: resourceIdSchema,
  name: z.string().min(1),
  email: z.email(),
  role: staffRoleSchema,
  twoFactor: z.boolean(),
  access: z.enum(["active", "blocked", "revoked"]),
  review: z.string(),
});
export const kycCaseSchema = z.object({
  id: resourceIdSchema,
  investorId: resourceIdSchema,
  submittedAt: timestampSchema,
  status: kycStatusSchema,
  tier: z.number().int().min(1).max(3),
  reviewerId: resourceIdSchema,
  birthYear: z.number().int().min(1900).max(2100),
  bvnLast4: z.string().regex(/^\d{4}$/),
  ninLast4: z.string().regex(/^\d{4}$/),
  idLast4: z.string().regex(/^\d{4}$/),
  idExpiry: dateSchema,
  addressIssuedAt: dateSchema,
  bvnMatch: z.boolean(),
  ninMatch: z.boolean(),
  faceMatch: z.number().min(0).max(100),
  note: z.string(),
});
export const statusChangeFormSchema = z.object({
  status: investorStatusSchema,
  reasonCode: z.enum(["compliance-review", "investor-request", "risk-review"]),
  reason: z.string().trim().min(15, "Explain the reason in at least 15 characters").max(2000),
  reviewed: z.literal(true, { error: "Review the impact and investor identity" }),
});
export const statusChangeRequestSchema = statusChangeFormSchema
  .extend({
    investorId: resourceIdSchema,
    currentStatus: investorStatusSchema,
    confirmation: z.string(),
    idempotencyKey: z.uuid(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === value.currentStatus)
      ctx.addIssue({ code: "custom", path: ["status"], message: "Choose a different status" });
    if (value.confirmation !== value.status.toUpperCase())
      ctx.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: `Type ${value.status.toUpperCase()} to confirm`,
      });
  });
export const staffInviteFormSchema = z.object({
  name: z.string().trim().min(1, "Enter their name").max(80),
  email: z.email(),
  role: staffRoleSchema,
  reason: z.string().trim().min(15, "Explain why this person needs access").max(2000),
  approverId: resourceIdSchema,
});
export const roleChangeFormSchema = z.object({
  staffId: resourceIdSchema,
  role: staffRoleSchema,
  reason: z.string().trim().min(15, "Explain why this change is needed").max(2000),
  approverId: resourceIdSchema,
});
export const roleChangeRequestSchema = roleChangeFormSchema
  .extend({ requestedBy: resourceIdSchema, idempotencyKey: z.uuid() })
  .strict()
  .superRefine((value, ctx) => {
    if (value.approverId === value.requestedBy || value.approverId === value.staffId)
      ctx.addIssue({ code: "custom", path: ["approverId"], message: "Choose an independent approver" });
  });
export const kycDecisionFormSchema = z
  .object({
    decision: z.enum(["approve", "reject", "request-information"]),
    reason: z.string().trim().min(15, "Record the evidence reviewed and your reason").max(2000),
    message: z.string().trim().max(2000),
    reviewed: z.literal(true, { error: "Confirm you reviewed the evidence" }),
  })
  .superRefine((value, ctx) => {
    if (value.decision !== "approve" && value.message.length < 15)
      ctx.addIssue({ code: "custom", path: ["message"], message: "Explain what the applicant needs to provide" });
  });
export const investorKycAfterDecision = {
  approve: "verified",
  reject: "actionRequired",
  "request-information": "actionRequired",
} as const satisfies Record<z.infer<typeof kycDecisionFormSchema>["decision"], z.infer<typeof kycStatusSchema>>;
export const kycDecisionRequestSchema = kycDecisionFormSchema
  .safeExtend({ caseId: resourceIdSchema, version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict();
export const kycOverrideFormSchema = z.object({
  reason: z.string().trim().min(20, "Record an evidence-based reason (at least 20 characters)").max(2000),
  approverId: resourceIdSchema,
});
export const kycOverrideRequestSchema = kycOverrideFormSchema
  .extend({ caseId: resourceIdSchema, requestedBy: resourceIdSchema, idempotencyKey: z.uuid() })
  .strict()
  .refine((v) => v.approverId !== v.requestedBy, { path: ["approverId"], message: "Choose an independent approver" });
export const staffSignInSchema = z
  .object({ email: z.email(), password: z.string().min(1, "Enter your password") })
  .strict();
export const staffVerificationSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("authenticator"),
    challengeId: resourceIdSchema,
    code: z.string().regex(/^\d{6}$/, "Enter a 6-digit code"),
  }),
  z.object({ method: z.literal("recovery"), challengeId: resourceIdSchema, code: z.string().trim().min(8).max(128) }),
]);
export const adminPeopleQuerySchema = paginationQuerySchema.extend({
  search: searchSchema.optional(),
  status: investorStatusSchema.optional(),
});
export const adminInvestorsResponseSchema = paginatedSchema(adminInvestorSchema);
export const adminKycQuerySchema = paginationQuerySchema.extend({
  search: searchSchema.optional(),
  status: kycStatusSchema.optional(),
});
export const adminKycResponseSchema = paginatedSchema(kycCaseSchema);
export const adminStaffResponseSchema = z.array(staffMemberSchema);
export const adminReviewRequestSchema = z.object({
  id: resourceIdSchema,
  kind: z.enum([
    "status",
    "role",
    "revoke",
    "invite",
    "kyc-decision",
    "kyc-override",
    "permissions",
    "return-schedule",
    "dividend-batch",
    "principal-batch",
    "accrual-override",
    "withdrawal-risk",
    "withdrawal-batch",
    "ledger-adjustment",
    "banking-config",
    "environment-review",
    "reconciliation",
    "report-adjustment",
    "legal-review",
    "model-review",
    "editorial-review",
    "payment-limits",
  ]),
  subjectId: resourceIdSchema,
  summary: z.string().min(1),
  reason: z.string().min(1),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  createdAt: timestampSchema,
  state: z.literal("pending-review"),
});
export type AdminInvestor = z.infer<typeof adminInvestorSchema>;
export type StaffMember = z.infer<typeof staffMemberSchema>;
export type KycCase = z.infer<typeof kycCaseSchema>;
export type AdminReviewRequest = z.infer<typeof adminReviewRequestSchema>;
export type StatusChangeForm = z.infer<typeof statusChangeFormSchema>;
export type RoleChangeForm = z.infer<typeof roleChangeFormSchema>;
export type StaffInviteForm = z.infer<typeof staffInviteFormSchema>;
export type KycDecisionForm = z.infer<typeof kycDecisionFormSchema>;

export const adminPermissionSchema = z.enum([
  "Investor profiles",
  "KYC documents / decide",
  "Suspend / blacklist",
  "Treasury / adjustments",
  "Withdrawal batch approve",
  "Create / publish property",
  "Returns / accrual override",
  "API configuration",
  "Role assignment",
]);
export const permissionChangeFormSchema = z.object({
  approverId: resourceIdSchema,
  permission: adminPermissionSchema,
  role: staffRoleSchema,
  level: z.enum(["Read only", "Request", "Prepare", "Allowed"]),
  reason: z.string().trim().min(15, "Explain why this permission is needed").max(2000),
});
export const permissionChangeRequestSchema = permissionChangeFormSchema
  .extend({ requestedBy: resourceIdSchema, approverId: resourceIdSchema, idempotencyKey: z.uuid() })
  .strict()
  .refine((v) => v.requestedBy !== v.approverId, { path: ["approverId"], message: "Choose an independent approver" });
export const revokeStaffAccessRequestSchema = z
  .object({
    staffId: resourceIdSchema,
    requestedBy: resourceIdSchema,
    approverId: resourceIdSchema,
    reason: z.string().trim().min(15).max(2000),
    idempotencyKey: z.uuid(),
  })
  .strict()
  .refine((v) => v.approverId !== v.requestedBy && v.approverId !== v.staffId, {
    path: ["approverId"],
    message: "Choose an independent approver",
  });
export const assignKycReviewerRequestSchema = z
  .object({
    caseId: resourceIdSchema,
    reviewerId: resourceIdSchema,
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const staffSignInChallengeSchema = z.object({
  challengeId: resourceIdSchema,
  expiresAt: timestampSchema,
  methods: z.array(z.enum(["authenticator", "recovery"])).min(1),
});
export type PermissionChangeForm = z.infer<typeof permissionChangeFormSchema>;

export const adminCustomerHistoryPointSchema = z.object({
  day: z.string().min(1),
  approved: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
});
export const adminPeopleOverviewResponseSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  investors: z.number().int().nonnegative(),
  admins: z.number().int().nonnegative(),
  customerHistory: z.array(adminCustomerHistoryPointSchema),
  verificationCounts: z.object({
    pending: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    escalated: z.number().int().nonnegative(),
  }),
});
