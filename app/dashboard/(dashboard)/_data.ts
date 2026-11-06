// ponytail: mock data from the Figma frame. Replace each export with an API call once the backend exists.

export const USER_FIRST_NAME = "Peter";

export const STATS = [
  { title: "Total Income", amount: "₦8.500 USD", change: "16.2 AVG", percent: 35.5 },
  { title: "Total Spending", amount: "₦3.500 USD", change: "5.2 AVG", percent: 35.5 },
  { title: "Spending Goal", amount: "₦12.000 USD", change: "16.2 AVG", percent: 35.5 },
  { title: "Total Transactions", amount: "₦17.254 USD", change: "16.2 AVG", percent: 35.5 },
];

const MONTHS = [
  "Mar '23",
  "Apr '23",
  "May '23",
  "Jun '23",
  "Jul '23",
  "Aug '23",
  "Sep '23",
  "Oct '23",
  "Nov '23",
  "Dec '23",
  "Jan '24",
  "Feb '24",
];
const POINTS_PER_MONTH = 12;

/** A wavy line that climbs near the end, like the Figma chart. Calculated, so it's the same on every render. */
const ASSET_HISTORY = Array.from({ length: MONTHS.length * POINTS_PER_MONTH }, (_, index) => {
  const noise = Math.sin(index * 1.3) * 0.5 + Math.sin(index * 0.37) * 0.6 + Math.sin(index * 2.9) * 0.4;
  const climb = Math.max(index - 95, 0) * 0.13;

  return {
    period: MONTHS[Math.floor(index / POINTS_PER_MONTH)],
    value: Number((33 + noise + climb).toFixed(2)),
  };
});

export const ASSET_RANGES = ["1H", "1D", "1W", "1M", "1Y"] as const;
export type AssetRange = (typeof ASSET_RANGES)[number];

const POINTS_IN_RANGE: Record<AssetRange, number> = {
  "1H": 24,
  "1D": 48,
  "1W": ASSET_HISTORY.length,
  "1M": 72,
  "1Y": ASSET_HISTORY.length,
};

export const getAssetHistory = (range: AssetRange) => ASSET_HISTORY.slice(-POINTS_IN_RANGE[range]);

export interface LatestTransaction {
  id: string;
  title: string;
  date: string;
  medium: string;
  amount: string;
}

const TRANSACTION_DATE = "11 Aug, 24. 10:36 am";

export const LATEST_TRANSACTIONS: LatestTransaction[] = [
  { id: "1", title: "Hooli INV-79820", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "2", title: "Initech INV-24792", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "3", title: "Bluth Company INV-84732", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "4", title: "Salaries", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "5", title: "Massive Dynamic INV-90874", date: TRANSACTION_DATE, medium: "Visa", amount: "-₦24,212.12" },
  { id: "6", title: "Jack Collingwood Card reload", date: TRANSACTION_DATE, medium: "Payoneer", amount: "-₦24,212.12" },
  { id: "7", title: "DOGE Yearly Return Invest.", date: TRANSACTION_DATE, medium: "Payoneer", amount: "-₦24,212.12" },
  { id: "8", title: "Globex Corporation INV-24398", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
];

export interface TransactionAccount {
  id: string;
  title: string;
  card: string;
  money: string;
}

const CARD = "**4291 - Exp: 12/26";

export const TRANSACTION_ACCOUNTS: TransactionAccount[] = [
  { id: "1", title: "John Snow - Metal", card: CARD, money: "₦95,200.00" },
  { id: "2", title: "John Snow - Virtual", card: CARD, money: "₦54,448.54" },
  { id: "3", title: "John Snow - Metal", card: CARD, money: "₦74,215.32" },
  { id: "4", title: "John Snow - Virtual", card: CARD, money: "₦67,511.21" },
  { id: "5", title: "John Snow - Metal", card: CARD, money: "₦36,122.54" },
  { id: "6", title: "John Snow - Virtual", card: CARD, money: "₦75,121.36" },
  { id: "7", title: "John Snow - Metal", card: CARD, money: "₦88,125.00" },
  { id: "8", title: "John Snow - Virtual", card: CARD, money: "₦96,214.03" },
];
