// ponytail: mock data from the Figma frames. Replace each export with an API call once the backend exists.

export type TransactionStatus = "Successful" | "Pending" | "Cancel";

export interface Transaction {
  key: string;
  title: string;
  date: string;
  invoice: string;
  medium: "PayPal" | "Visa" | "Payoneer";
  amount: string;
  status: TransactionStatus;
}

const DESIGN_ROWS: [string, string, Transaction["medium"], TransactionStatus][] = [
  ["Deposit Cash", "#526534", "PayPal", "Successful"],
  ["Withdraw Cash", "#526520", "PayPal", "Pending"],
  ["Online Transfer", "#256584", "PayPal", "Successful"],
  ["Check Deposit", "#200257", "PayPal", "Pending"],
  ["ATM Withdrawal", "#696589", "Visa", "Successful"],
  ["Wire Transfer", "#526525", "Payoneer", "Cancel"],
  ["Bill Payment", "#105986", "Payoneer", "Successful"],
  ["Mobile Banking Transfer", "#526587", "PayPal", "Pending"],
  ["Direct Deposit", "#105986", "Payoneer", "Successful"],
  ["Balance Inquiry", "#526587", "PayPal", "Pending"],
  ["Loan Payment", "#105986", "Payoneer", "Successful"],
  ["Foreign Currency Exchange", "#526587", "PayPal", "Cancel"],
  ["Overdraft Fee", "#105986", "Visa", "Successful"],
  ["Automatic Debit", "#526587", "Payoneer", "Successful"],
  ["Interest Deposit", "#105986", "Visa", "Successful"],
  ["Account Closure", "#526587", "Payoneer", "Successful"],
  ["Credit Card Payment", "#105986", "Visa", "Successful"],
  ["Stop Payment", "#526587", "PayPal", "Successful"],
];

// The first 18 rows are from the design; the rest repeat them so paging has 100 entries to work with.
export const TRANSACTIONS: Transaction[] = Array.from({ length: 100 }, (_, index) => {
  const [title, invoice, medium, status] = DESIGN_ROWS[index % DESIGN_ROWS.length];

  return {
    key: String(index),
    title,
    date: "11 Aug, 24. 10:36 am",
    invoice,
    medium,
    amount: "-₦24,212.12",
    status,
  };
});

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
