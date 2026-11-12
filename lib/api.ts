import { z } from "zod";

/** Paths on the CityCore API (citycore-server), relative to NEXT_PUBLIC_API_URL. */
export const API_ROUTES = {
  login: "/auth/login",
  logout: "/auth/logout",
  me: "/users/me",
  wallet: "/wallet",
  walletTransactions: "/wallet/transactions",
  // Not on the server yet. These keep serving their mock data.
  dashboard: "/dashboard",
  properties: "/properties",
  property: (id: string) => `/properties/${encodeURIComponent(id)}`,
  invest: (id: string) => `/properties/${encodeURIComponent(id)}/invest`,
  holdings: "/portfolio/holdings",
  holding: (id: string) => `/portfolio/holdings/${encodeURIComponent(id)}`,
  withdraw: "/wallet/withdraw",
  fundWithCard: "/wallet/fund/card",
  payoutAccount: "/wallet/payout-account",
  ninLookup: "/kyc/nin",
  kycSubmission: "/kyc",
  referrals: "/referrals",
  resolveReferralCode: "/referrals/resolve",
  notifications: "/notifications",
} as const;

const kobo = (value: number) => value / 100;

const serverWalletSchema = z
  .object({
    balance: z.number(),
    virtualAccount: z.object({ bankName: z.string(), accountNumber: z.string(), accountName: z.string() }).nullable(),
  })
  .transform((wallet) => ({
    balance: kobo(wallet.balance),
    pendingWithdrawals: 0,
    fundingAccount: wallet.virtualAccount,
    payoutAccount: null,
  }));

const TRANSACTION_TYPE = {
  funding: "deposit",
  referral_commission: "commission",
  investment: "investment",
  investment_return: "payout",
  investment_principal: "payout",
  investment_withdrawal: "withdrawal",
} as const;
const TRANSACTION_TITLE = {
  funding: "Wallet funding",
  referral_commission: "Referral commission",
  investment: "Investment",
  investment_return: "Investment return",
  investment_principal: "Principal returned",
  investment_withdrawal: "Investment withdrawal",
} as const;
const TRANSACTION_STATUS = {
  success: "successful",
  pending: "pending",
  flagged: "pending",
  failed: "failed",
  abandoned: "failed",
} as const;

const serverTransactionSchema = z
  .object({
    reference: z.string(),
    type: z.enum([
      "funding",
      "referral_commission",
      "investment",
      "investment_return",
      "investment_principal",
      "investment_withdrawal",
    ]),
    direction: z.enum(["credit", "debit"]),
    amount: z.number(),
    status: z.enum(["pending", "success", "failed", "abandoned", "flagged"]),
    paidAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .transform((tx) => ({
    id: tx.reference,
    title: TRANSACTION_TITLE[tx.type],
    type: TRANSACTION_TYPE[tx.type],
    status: TRANSACTION_STATUS[tx.status],
    amount: (tx.direction === "debit" ? -1 : 1) * kobo(tx.amount),
    date: tx.paidAt ?? tx.createdAt,
  }));

/**
 * Routes connected to the server, each with the schema that turns its response into the shape the web schemas
 * expect. Any route not listed serves its mock data, even with NEXT_PUBLIC_API_URL set.
 */
export const LIVE_ROUTES: Record<string, { schema: z.ZodType; query?: Record<string, string | number> }> = {
  [API_ROUTES.wallet]: { schema: serverWalletSchema },
  [API_ROUTES.walletTransactions]: {
    schema: z.array(serverTransactionSchema),
    query: { limit: 100, sort: "-createdAt" },
  },
};
