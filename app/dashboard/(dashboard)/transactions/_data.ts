// ponytail: same entries as the mobile WalletMockData.transactions(). Replace with GET /wallet/transactions.
import type { Transaction } from "@/constant/schemas/finance";
import { REFERRAL_DASHBOARD } from "@/lib/referrals";

export type { Transaction, TransactionStatus, TransactionType } from "@/constant/schemas/finance";

const tx = (
  id: string,
  title: string,
  type: Transaction["type"],
  amount: number,
  date: string,
  status: Transaction["status"] = "successful"
): Transaction => ({ id, title, type, status, amount, date });

export const TRANSACTIONS: Transaction[] = [
  ...REFERRAL_DASHBOARD.commissions
    .filter((entry) => entry.status === "paid")
    .map((entry) => tx(entry.id, `Referral commission · ${entry.title}`, "commission", entry.amount, entry.date)),
  tx("tx_1", "Golden Estate, Lekki", "investment", -450_000, "2026-11-08T06:00:00+01:00"),
  tx("tx_2", "Wallet funding · Transfer", "deposit", 800_000, "2026-11-07T07:00:00+01:00"),
  tx("tx_3", "Monthly yield · Palm Court", "payout", 42_500, "2026-11-04T09:00:00+01:00"),
  tx("tx_4", "Withdrawal to GTBank", "withdrawal", -150_000, "2026-11-02T09:00:00+01:00", "pending"),
  tx("tx_5", "Wallet funding · Card", "deposit", 200_000, "2026-10-30T09:00:00+01:00", "failed"),
  tx("tx_6", "Cedar Gardens, GRA", "investment", -1_500_000, "2026-10-27T09:00:00+01:00"),
  tx("tx_7", "Wallet funding · Transfer", "deposit", 2_000_000, "2026-10-26T09:00:00+01:00"),
  tx("tx_8", "Marina Heights payout", "payout", 1_755_000, "2026-09-11T09:00:00+01:00"),
  tx("tx_9", "Withdrawal to GTBank", "withdrawal", -500_000, "2026-09-08T09:00:00+01:00"),
].toSorted((a, b) => b.date.localeCompare(a.date));

// Same derived values as the getters on the mobile Transaction model.
export const transactionReference = (transaction: Transaction) =>
  `CC-${transaction.id.toUpperCase().replaceAll("_", "")}`;
export const TRANSACTION_TYPE_LABELS: Record<Transaction["type"], string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  payout: "Yield payout",
  commission: "Referral commission",
};
export const isCredit = (transaction: Transaction) =>
  transaction.type === "deposit" || transaction.type === "payout" || transaction.type === "commission";

export const REPORT_STATS = [
  { label: "Total Balance", value: 98.5, trend: { value: "50.8%", direction: "up" } },
  { label: "Total Deposits", value: 22.745, trend: { value: "17.9%", direction: "up", tone: "negative" } },
  { label: "Yearly In", value: 33.223, trend: { value: "66.3%", direction: "up" } },
  { label: "Yearly Out", value: 45.654, trend: { value: "76.7%", direction: "down", tone: "negative" } },
] as const;

export const REPORT_TREND = [30, 55, 50, 85, 45, 60, 35, 55, 30, 62];

export const REPORT_CHART = [
  { month: "Jan", recentYear: 20, lastFiveYears: 85 },
  { month: "Feb", recentYear: 38, lastFiveYears: 65 },
  { month: "Mar", recentYear: 38, lastFiveYears: 75 },
  { month: "Apr", recentYear: 72, lastFiveYears: 38 },
  { month: "May", recentYear: 55, lastFiveYears: 85 },
  { month: "Jun", recentYear: 63, lastFiveYears: 35 },
  { month: "Jul", recentYear: 43, lastFiveYears: 62 },
  { month: "Aug", recentYear: 76, lastFiveYears: 40 },
  { month: "Sep", recentYear: 55, lastFiveYears: 40 },
  { month: "Oct", recentYear: 80, lastFiveYears: 64 },
  { month: "Nov", recentYear: 40, lastFiveYears: 50 },
  { month: "Dec", recentYear: 80, lastFiveYears: 89 },
];

export const CURRENCIES = [
  { value: "usd", label: "USD", rate: 1 },
  { value: "eur", label: "EUR", rate: 0.92 },
  { value: "gbp", label: "GBP", rate: 0.79 },
];

export const REPORT_PERIODS = [
  { value: "recent-years", label: "Recent years", scale: 1 },
  { value: "last-5-years", label: "Last 5 years", scale: 0.85 },
];
