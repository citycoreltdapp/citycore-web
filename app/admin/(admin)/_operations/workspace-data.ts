import type {
  adminContentStateSchema,
  recommendationAuditSchema,
  signedContractAuditSchema,
} from "@/constant/schemas/admin-content";
import type { statementRowSchema } from "@/constant/schemas/admin-reports";
import type {
  adminNotificationPreferencesSchema,
  adminPaymentLimitsSchema,
  adminPersonalStateSchema,
  adminTaxSettingsSchema,
} from "@/constant/schemas/admin-settings";
import type { adminSupportStateSchema } from "@/constant/schemas/admin-support";
import type { z } from "zod";

export const PERSONAL_DEFAULTS: z.infer<typeof adminPersonalStateSchema> = {
  personal: {
    firstName: "Nneka",
    lastName: "Eze",
    email: "nneka@citycore.example",
    phone: "+2348012345001",
    country: "NG",
    state: "Lagos",
    address: "City Core office, Lagos",
  },
  kin: {
    fullName: "Chidi Eze",
    relationship: "sibling",
    email: "chidi@example.com",
    phone: "+2348012345021",
    address: "Lagos, Nigeria",
  },
  preferences: { receipts: true, securityAlerts: true, investmentUpdates: true, promotions: false },
};
export const NOTIFICATION_DEFAULTS: z.infer<typeof adminNotificationPreferencesSchema> = {
  email: { activity: true, communications: false, meetups: true },
  sms: { activity: false, communications: true, meetups: false },
  push: { activity: false, communications: true, meetups: false },
  news: { activity: true, communications: false, meetups: true },
  buzz: { activity: true, communications: false, meetups: true },
  updates: { activity: false, communications: true, meetups: false },
};
export const TAX_SETTINGS_KEY = "citycore-admin-tax-v1";
export const TAX_DEFAULTS: z.infer<typeof adminTaxSettingsSchema> = { withholdingRate: 10 };
export const LIMIT_DEFAULTS: z.infer<typeof adminPaymentLimitsSchema> = {
  cashWithdrawal: 1000000,
  privateTransaction: 2000000,
  onlinePayment: 1500000,
  storePurchase: 500000,
  onlinePurchase: 500000,
  zipTransfer: 1000000,
};
export const CONTENT_DEFAULTS: z.infer<typeof adminContentStateSchema> = {
  legal: {
    title: "Golden Estate Investor Agreement",
    version: "1.4",
    body: "Investor: {{legal_name}} · Units: {{units}} · Principal: {{principal}}. Target returns are projections, not guarantees. The investment term is 12 months from allocation. Capital and liquidity are at risk. Early exit is subject to review and is not guaranteed.",
    reason: "Clarify maturity timing and early-exit limitations",
  },
  model: {
    locationWeight: 35,
    budgetWeight: 25,
    riskWeight: 25,
    tenureWeight: 15,
    confidenceThreshold: 0.6,
    uncertaintyDisclosure: true,
    assumptions:
      "Illustrative listing medians; monthly refresh; ±6 percentage point uncertainty band. Sparse market data can bias estimates.",
  },
  article: {
    title: "Understanding the Lekki property market",
    source: "Illustrative listings · January–October 2026",
    summary:
      "Demand signals vary by neighbourhood; liquidity remains uncertain. Forecasts are illustrative and do not guarantee future returns.",
    forecastMin: 8,
    forecastMax: 20,
    reviewDate: "2026-10-20",
  },
  prospectusProperty: "golden-estate",
};
export const SIGNED_AUDIT: z.infer<typeof signedContractAuditSchema>[] = [
  {
    id: "GE-0014",
    investorReference: "CC-U014",
    acceptedVersion: "GE v1.3",
    acceptedAt: "2026-02-18T10:20:00Z",
    evidenceReference: "CONSENT-GE-0014",
  },
  {
    id: "GE-0028",
    investorReference: "CC-U028",
    acceptedVersion: "GE v1.3",
    acceptedAt: "2026-02-20T08:42:00Z",
    evidenceReference: "CONSENT-GE-0028",
  },
  {
    id: "SC-0051",
    investorReference: "CC-U051",
    acceptedVersion: "SC v1.2",
    acceptedAt: "2026-03-04T13:10:00Z",
    evidenceReference: "CONSENT-SC-0051",
  },
];
export const RECOMMENDATION_AUDIT: z.infer<typeof recommendationAuditSchema>[] = [
  {
    id: "REC-014",
    investorReference: "CC-U014",
    query: "Key risks in Lekki?",
    recommendation: "Golden Estate · medium confidence",
    modelVersion: "0.7",
    context: "Balanced · 12 months · Lagos",
  },
  {
    id: "REC-028",
    investorReference: "CC-U028",
    query: "Abuja under ₦300k",
    recommendation: "Silver City · medium confidence",
    modelVersion: "0.7",
    context: "Balanced · 18 months · Abuja",
  },
  {
    id: "REC-051",
    investorReference: "CC-U051",
    query: "Short-term exit options",
    recommendation: "No suitable match",
    modelVersion: "0.7",
    context: "Liquidity preference mismatch",
  },
];
export const SUPPORT_DEFAULTS: z.infer<typeof adminSupportStateSchema> = {
  tickets: [
    {
      id: "T-208",
      category: "transactions",
      transactionReference: "CC-1018",
      subject: "Withdrawal not received",
      details: "The investor's bank has not received this transfer.",
      status: "in-progress",
      createdAt: "2026-10-22T09:32:00Z",
      messages: [
        {
          id: "MSG-1",
          author: "Ada Okafor",
          body: "The withdrawal is marked failed. Can you confirm the reversal status?",
          createdAt: "2026-10-22T09:32:00Z",
          local: false,
          attachments: [],
        },
        {
          id: "MSG-2",
          author: "Support",
          body: "We linked the dispute to CC-1018. Query the settlement record before advising a retry. Please do not submit the same transfer again yet.",
          createdAt: "2026-10-22T09:40:00Z",
          local: false,
          attachments: [],
        },
      ],
    },
    {
      id: "T-201",
      category: "verification",
      transactionReference: "",
      subject: "Address document",
      details: "Please review the new address document reference.",
      status: "awaiting-reply",
      createdAt: "2026-10-21T10:00:00Z",
      messages: [],
    },
    {
      id: "T-184",
      category: "transactions",
      transactionReference: "CC-1022",
      subject: "Funding receipt",
      details: "A receipt was requested for the completed funding transaction.",
      status: "resolved",
      createdAt: "2026-10-18T10:00:00Z",
      messages: [],
    },
  ],
  notifications: [
    {
      id: "N-1",
      title: "Identity verification needed",
      body: "Complete the outstanding document review.",
      target: "verification",
      reference: "CC-U014",
      isRead: false,
    },
    {
      id: "N-2",
      title: "Ticket T-208 updated",
      body: "Withdrawal dispute requires a settlement status query.",
      target: "ticket",
      reference: "T-208",
      isRead: false,
    },
    {
      id: "N-3",
      title: "Silver City dividend pending",
      body: "₦35,000 is awaiting processing · CC-1020.",
      target: "transaction",
      reference: "CC-1020",
      isRead: false,
    },
    {
      id: "N-4",
      title: "Deposit successful",
      body: "₦250,000 bank-transfer deposit confirmed · receipt CC-1022.",
      target: "transaction",
      reference: "CC-1022",
      isRead: true,
    },
  ],
};
export const REPORT_ROWS: z.infer<typeof statementRowSchema>[] = [
  ...Array.from({ length: 98 }, (_, i) => ({
    reference: `CC-${2001 + i}`,
    date: "2026-10-21",
    amount: i === 97 ? 50000 : 100000,
    status: "matched" as const,
    issue: "",
    owner: "Finance",
  })),
  {
    reference: "CC-1031",
    date: "2026-10-21",
    amount: 200000,
    status: "unmatched",
    issue: "Bank debit absent in gateway",
    owner: "Finance",
  },
  {
    reference: "CC-1032",
    date: "2026-10-21",
    amount: 50000,
    status: "unmatched",
    issue: "Gateway success absent in bank",
    owner: "Treasury",
  },
];
export const LEGAL_DOCUMENTS = [
  { document: "Terms of use", published: "v2.2 · 01 Sep", draft: "v2.3", review: "Legal pending" },
  { document: "Privacy policy", published: "v1.8 · 01 Sep", draft: "—", review: "Current" },
  { document: "Risk disclosure", published: "v1.3 · 01 Oct", draft: "v1.4", review: "Compliance pending" },
  { document: "Investor agreement", published: "GE v1.3", draft: "GE v1.4", review: "Legal pending" },
];
