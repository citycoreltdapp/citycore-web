// ponytail: mock data from the Figma frame. Replace each export with an API call once the backend exists.

// Slice sizes are set to match the design; displayValue carries the figures it shows.
export const BALANCES = [
  { key: "ngn", label: "NGN", value: 52, displayValue: "23,232", color: "var(--chart-2)" },
  { key: "usd", label: "USD", value: 10, displayValue: "9,235", color: "var(--chart-3)" },
  { key: "eur", label: "EUR", value: 20, displayValue: "12,326", color: "var(--chart-1)" },
  { key: "gbp", label: "GBP", value: 18, displayValue: "11,458", color: "oklch(0.69 0.17 24)" },
];
export const TOTAL_BALANCE = "99,800.35";

const LAST_YEARS_TRANSFERS = [
  { month: "Jan", usd: 0, eur: 0 },
  { month: "Feb", usd: 60, eur: 105 },
  { month: "Mar", usd: 20, eur: 30 },
  { month: "Apr", usd: 90, eur: 165 },
  { month: "May", usd: 45, eur: 80 },
  { month: "Jun", usd: 110, eur: 205 },
  { month: "Jul", usd: 55, eur: 95 },
  { month: "Aug", usd: 130, eur: 245 },
  { month: "Sep", usd: 45, eur: 75 },
  { month: "Oct", usd: 110, eur: 215 },
  { month: "Nov", usd: 75, eur: 140 },
  { month: "Dec", usd: 120, eur: 230 },
];

const scaleTransfers = (scale: number) =>
  LAST_YEARS_TRANSFERS.map(({ month, usd, eur }) => ({
    month,
    usd: Math.round(usd * scale),
    eur: Math.round(eur * scale),
  }));

export const TRANSFER_PERIODS = [
  { value: "last-years", label: "Last years" },
  { value: "this-year", label: "This year" },
  { value: "last-month", label: "Last month" },
];

export const TRANSFERS_BY_PERIOD: Record<string, typeof LAST_YEARS_TRANSFERS> = {
  "last-years": LAST_YEARS_TRANSFERS,
  "this-year": scaleTransfers(0.75),
  "last-month": scaleTransfers(0.4),
};

export type FundingMethodKey = "bank" | "card" | "virtual";

export interface FundingMethod {
  label: string;
  /** The short line under the label on the method's card. */
  hint: string;
  note: string;
  rows: { label: string; value: string; canCopy?: boolean }[];
  actionLabel: string;
  /** The toast shown after the button is pressed. Leave out while the method isn't available yet. */
  confirmation?: string;
}

export const FUNDING_METHODS: Record<FundingMethodKey, FundingMethod> = {
  bank: {
    label: "Bank transfer",
    hint: "Demo Bank •••• 2048",
    note: "Illustrative bank account • transfer the exact amount and include the funding reference.",
    rows: [
      { label: "Bank", value: "Demo Bank • sandbox" },
      { label: "Account holder", value: "City Core / Ada Okafor" },
      { label: "Account number", value: "•••• •••• 2048" },
      { label: "Reference", value: "CC-FUND-1022", canCopy: true },
      { label: "Fee", value: "₦0 • your bank may charge fees" },
    ],
    actionLabel: "I have made the transfer",
    confirmation: "Thanks. Your wallet updates once the provider confirms the transfer.",
  },
  card: {
    label: "Card",
    hint: "•••• 4242 • 08/28",
    note: "Your card is charged straight away and the amount shows in your wallet after confirmation.",
    rows: [
      { label: "Card", value: "Visa / Mastercard" },
      { label: "Card number", value: "•••• 4242" },
      { label: "Expiry", value: "08/28" },
      { label: "Fee", value: "₦0" },
    ],
    actionLabel: "Pay with card",
    confirmation: "Payment sent. Your wallet updates after provider confirmation.",
  },
  virtual: {
    label: "Virtual account",
    hint: "•••• 2048 • after KYC",
    note: "Your dedicated account is assigned once your KYC is approved.",
    rows: [
      { label: "Account number", value: "•••• 2048" },
      { label: "Status", value: "Awaiting KYC" },
      { label: "Fee", value: "₦0 • your bank may charge fees" },
    ],
    actionLabel: "Awaiting KYC",
  },
};

export const PAYMENT_STATUSES = ["Successful", "Pending", "Cancel"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
  key: string;
  id: string;
  card: string;
  account: string;
  money: number;
  medium: "Payoneer" | "Visa" | "PayPal";
  date: string;
  time: string;
  status: PaymentStatus;
}

const DESIGN_ROWS: [string, number, Payment["medium"], string, PaymentStatus][] = [
  ["999 *** *** 123", 7000, "Payoneer", "05:12 AM", "Successful"],
  ["874 *** *** 875", 2100, "Visa", "08:17 AM", "Successful"],
  ["412 *** *** 954", 4000, "PayPal", "09:01 AM", "Pending"],
  ["135 *** *** 654", 1000, "Payoneer", "10:12 AM", "Cancel"],
  ["564 *** *** 325", 9450, "PayPal", "11:12 AM", "Successful"],
  ["354 *** *** 254", 3250, "Payoneer", "01:12 PM", "Successful"],
  ["564 *** *** 325", 2700, "Payoneer", "05:07 PM", "Pending"],
  ["354 *** *** 254", 4400, "Visa", "09:17 PM", "Successful"],
];

// The first 8 rows are from the design; the rest repeat them so paging has 100 entries to work with.
export const PAYMENTS: Payment[] = Array.from({ length: 100 }, (_, index) => {
  const [id, money, medium, time, status] = DESIGN_ROWS[index % DESIGN_ROWS.length];

  return {
    key: String(index),
    id,
    card: "**4291 - Exp: 12/26",
    account: "326 *** *** 124",
    money: money + Math.floor(index / DESIGN_ROWS.length) * 50,
    medium,
    date: "03/05/2029",
    time,
    status,
  };
});
