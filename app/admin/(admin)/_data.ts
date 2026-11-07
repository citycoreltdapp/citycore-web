// ponytail: mock data from the Figma frames. Replace each export with an API call once the backend exists.
import type { DashboardNotification } from "@/constant/notifications";
import type {
  AdminIncomeExpensePoint,
  AdminRange,
  AdminStat,
  AdminTransactionOverviewPoint,
  AdminUsersByCountry,
} from "@/constant/schemas/admin";

export const ADMIN_STATS: AdminStat[] = [
  { title: "Total Income", amount: "₦99.500 USD", change: "50.8%", tone: "neutral" },
  { title: "Total Spending", amount: "₦17.324 USD", change: "33.8%", tone: "warning" },
  { title: "Spending Goal", amount: "₦945.500 USD", change: "88.8%", tone: "info" },
  { title: "Total Transactions", amount: "₦37.412 USD", change: "09.8%", tone: "negative" },
];

export const RANGES: { value: AdminRange; label: string; scale: number }[] = [
  { value: "15d", label: "Last 15 Days", scale: 1 },
  { value: "30d", label: "Last 30 Days", scale: 0.92 },
  { value: "90d", label: "Last 90 Days", scale: 0.85 },
];

export const TRANSACTION_OVERVIEW: AdminTransactionOverviewPoint[] = [
  { month: "Jan", volume: 80, trend: 32, average: 12 },
  { month: "Feb", volume: 96, trend: 48, average: 8 },
  { month: "Mar", volume: 70, trend: 40, average: 14 },
  { month: "Apr", volume: 110, trend: 64, average: 22 },
  { month: "May", volume: 79, trend: 48, average: 12 },
  { month: "Jun", volume: 85, trend: 42, average: 16 },
  { month: "Jul", volume: 52, trend: 54, average: 10 },
  { month: "Aug", volume: 30, trend: 46, average: 8 },
  { month: "Sep", volume: 94, trend: 40, average: 12 },
  { month: "Oct", volume: 43, trend: 60, average: 28 },
  { month: "Nov", volume: 90, trend: 62, average: 10 },
  { month: "Dec", volume: 38, trend: 68, average: 34 },
];

export const INCOME_AND_EXPENSES: AdminIncomeExpensePoint[] = [
  { week: "Week 01", income: 480, expenses: 200 },
  { week: "Week 02", income: 240, expenses: 400 },
  { week: "Week 03", income: 400, expenses: 240 },
  { week: "Week 04", income: 200, expenses: 400 },
  { week: "Week 05", income: 490, expenses: 195 },
  { week: "Week 06", income: 190, expenses: 410 },
  { week: "Week 07", income: 460, expenses: 280 },
  { week: "Week 08", income: 210, expenses: 390 },
  { week: "Week 09", income: 490, expenses: 195 },
  { week: "Week 10", income: 200, expenses: 300 },
];

const TRANSACTION_DATE = "11 Aug, 24. 10:36 am";

export const LATEST_TRANSACTIONS = [
  { id: "1", title: "Hooli INV-79820", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "2", title: "Initech INV-24792", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
  { id: "3", title: "Massive Dynamic INV-90874", date: TRANSACTION_DATE, medium: "Visa", amount: "-₦24,212.12" },
  { id: "4", title: "Jack Collingwood Card reload", date: TRANSACTION_DATE, medium: "Payoneer", amount: "-₦24,212.12" },
  { id: "5", title: "DOGE Yearly Return Invest.", date: TRANSACTION_DATE, medium: "Payoneer", amount: "-₦24,212.12" },
  { id: "6", title: "Globex Corporation INV-24398", date: TRANSACTION_DATE, medium: "PayPal", amount: "-₦24,212.12" },
];

/** The hub every line on the map runs to. */
export const HOME_COUNTRY: AdminUsersByCountry = {
  code: "NG",
  country: "Nigeria",
  latitude: 9.1,
  longitude: 7.5,
  users: 18_420,
};

export const USERS_BY_COUNTRY: AdminUsersByCountry[] = [
  { code: "US", country: "United States", latitude: 38, longitude: -97, users: 1_240 },
  { code: "CA", country: "Canada", latitude: 56, longitude: -106, users: 620 },
  { code: "BR", country: "Brazil", latitude: -12, longitude: -52, users: 310 },
  { code: "GB", country: "United Kingdom", latitude: 53, longitude: -1.5, users: 2_180 },
  { code: "AE", country: "United Arab Emirates", latitude: 24, longitude: 54, users: 870 },
  { code: "ZA", country: "South Africa", latitude: -29, longitude: 25, users: 540 },
  { code: "IN", country: "India", latitude: 21, longitude: 79, users: 460 },
  { code: "CN", country: "China", latitude: 35, longitude: 104, users: 280 },
];

export const ADMIN_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: "1",
    type: "security",
    title: "KYC submissions waiting",
    description: "12 new identity submissions are ready for review.",
    time: "5m",
    group: "Today",
    isRead: false,
  },
  {
    id: "2",
    type: "withdrawal",
    title: "Large withdrawal flagged",
    description: "A ₦4,500,000.00 withdrawal needs a second approval.",
    time: "1h",
    group: "Today",
    isRead: false,
  },
  {
    id: "3",
    type: "investment",
    title: "Golden Estate nearly allocated",
    description: "68% of units are allocated, with 320 left.",
    time: "3h",
    group: "Today",
    isRead: false,
  },
  {
    id: "4",
    type: "deposit",
    title: "Daily settlement complete",
    description: "Yesterday's wallet deposits have settled.",
    time: "1d",
    group: "Earlier",
    isRead: true,
  },
];
