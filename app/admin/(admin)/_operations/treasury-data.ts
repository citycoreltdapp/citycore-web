import type {
  adminWithdrawalSchema,
  bankingRetryRowSchema,
  disbursementHistorySchema,
  ledgerMappingSchema,
  treasuryAccountSchema,
} from "@/constant/schemas/admin-treasury";
import type { z } from "zod";

export const TREASURY_ACCOUNTS: z.infer<typeof treasuryAccountSchema>[] = [
  {
    id: "operating",
    name: "Master operating",
    destination: "Demo Bank · •••• 1001",
    balance: 8400000,
    ownership: "platform",
    state: "Sandbox snapshot",
  },
  {
    id: "escrow",
    name: "Investment escrow",
    destination: "Trust account · •••• 2200",
    balance: 157500000,
    ownership: "investors-restricted",
    state: "Sandbox snapshot",
  },
  {
    id: "collection",
    name: "Virtual collection pool",
    destination: "Demo Bank · •••• 2048",
    balance: 3600000,
    ownership: "investor-collections",
    state: "Awaiting allocation",
  },
  {
    id: "gateway",
    name: "Gateway float",
    destination: "Sandbox gateway",
    balance: 2100000,
    ownership: "settlement-receivable",
    state: "Pending settlement",
  },
];
export const WITHDRAWAL_QUEUE: z.infer<typeof adminWithdrawalSchema>[] = [
  {
    id: "WD-041",
    investorId: "CC-U028",
    name: "Adanna Nwosu",
    bankLast4: "1132",
    amount: 2000000,
    fee: 50,
    risk: "new-device",
    kycVerified: true,
    bankVerified: true,
    version: 1,
  },
  {
    id: "WD-042",
    investorId: "CC-U104",
    name: "Chuka Eze",
    bankLast4: "8402",
    amount: 1500000,
    fee: 50,
    risk: "velocity",
    kycVerified: true,
    bankVerified: true,
    version: 1,
  },
  {
    id: "WD-043",
    investorId: "CC-U105",
    name: "Mary Ibrahim",
    bankLast4: "0621",
    amount: 1000000,
    fee: 50,
    risk: "clear",
    kycVerified: true,
    bankVerified: true,
    version: 1,
  },
];
export const DISBURSEMENT_HISTORY: z.infer<typeof disbursementHistorySchema>[] = [
  {
    id: "DIV-009",
    type: "dividend",
    scheduledDate: "2026-09-30",
    gross: 180000,
    net: 162000,
    status: "sandbox-success",
  },
  {
    id: "DIV-010",
    type: "dividend",
    scheduledDate: "2026-10-31",
    gross: 240000,
    net: 216000,
    status: "pending-checker",
  },
  { id: "MAT-004", type: "principal", scheduledDate: "2026-11-30", gross: 5000000, net: 5000000, status: "draft" },
];
export const RETURN_COHORTS = [
  { id: "golden-estate", name: "Golden Estate", investors: 40, principal: 4000000 },
  { id: "silver-city", name: "Silver City", investors: 20, principal: 2000000 },
];
export const LEDGER_MAPPINGS: z.infer<typeof ledgerMappingSchema>[] = [
  {
    id: "deposit",
    event: "Confirmed deposit",
    debitAccount: "1010 · Bank collections",
    creditAccount: "2010 · Investor wallet liability",
    state: "draft",
  },
  {
    id: "purchase",
    event: "Investment purchase",
    debitAccount: "2010 · Wallet liability",
    creditAccount: "2020 · Investment principal liability",
    state: "draft",
  },
  {
    id: "dividend",
    event: "Dividend credit",
    debitAccount: "5010 · Distribution expense",
    creditAccount: "2010 · Wallet liability",
    state: "draft",
  },
  {
    id: "withdrawal",
    event: "Withdrawal settled",
    debitAccount: "2010 · Wallet liability",
    creditAccount: "1010 · Bank collections",
    state: "draft",
  },
];
export const BANKING_RETRIES: z.infer<typeof bankingRetryRowSchema>[] = [
  {
    id: "SYNC-014",
    operation: "Balance query",
    failure: "Configuration missing",
    nextStep: "Complete setup",
    state: "blocked",
    originalReference: "SYNC-014-original",
    idempotencyKey: "sync-014-sandbox",
  },
  {
    id: "POST-022",
    operation: "Deposit posting",
    failure: "Sandbox timeout",
    nextStep: "Query original reference",
    state: "review-before-retry",
    originalReference: "CC-1022",
    idempotencyKey: "deposit-cc1022",
  },
  {
    id: "LINK-009",
    operation: "Customer link",
    failure: "KYC not eligible",
    nextStep: "Compliance review",
    state: "blocked",
    originalReference: "CC-U014",
    idempotencyKey: "link-ccu014",
  },
];
