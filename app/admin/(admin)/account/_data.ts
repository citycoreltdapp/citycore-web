import type { AdminAccountTransaction, AdminInvoice } from "@/constant/schemas/admin-account";

export const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);
export const ACCOUNT_TRANSACTIONS: AdminAccountTransaction[] = [
  "Deposit Cash",
  "Withdraw Cash",
  "Online Transfer",
  "Check Deposit",
  "ATM Withdrawal",
  "Wire Transfer",
  "Bill Payment",
  "Mobile Banking Transfer",
  "Direct Deposit",
  "Balance Inquiry",
  "Loan Payment",
  "Foreign Currency Exchange",
  "Overdraft Fee",
  "Automatic Debit",
  "Interest Deposit",
  "Account Closure",
  "Credit Card Payment",
  "Stop Payment",
].map((title, i) => ({
  id: `transaction-${i}`,
  title,
  invoiceNumber: `${526534 + i}`,
  medium: ["PayPal", "Visa", "Payoneer"][i % 3],
  amount: 24212.12 + i * 100,
  direction: i % 3 === 0 ? "credit" : "debit",
  status: i === 5 || i === 11 ? "cancelled" : i % 3 === 1 ? "pending" : "successful",
  createdAt: `2026-11-${String(7 - Math.floor(i / 3)).padStart(2, "0")}T10:36:00Z`,
}));
export const INITIAL_INVOICES: AdminInvoice[] = [
  "PaymentPal Invoice",
  "QuickBills Statement",
  "SwiftSettle Invoice",
  "EZPay Receipt",
  "RapidInvoice Solutions",
  "CashFlow Express Bill",
  "SmartSettle Receipt",
  "InstaPay Invoice",
  "BreezeBilling Statement",
  "SpeedySettle Invoice",
  "SnapFunds Receipt",
  "EasyPay Express Bill",
  "FleetFunds Invoice",
  "PrestoPay Invoice",
  "CleverCash Receipt",
  "ExpressExpense Bill",
  "SwiftBills Solutions",
].map((description, i) => ({
  id: `invoice-${i}`,
  template: "web-design",
  category: "design",
  invoiceNumber: `${526534 + i}`,
  dueDate: "2026-12-03",
  companyName: ["Max Inc.", "Urban Living Ltd", "City Partners"][i % 3],
  address: "4517 Washington Avenue, Lagos, Nigeria",
  email: "accounts@example.com",
  phone: "+2348012345678",
  amount: Math.round((475.22 + i * 23.41) * 100) / 100,
  rate: [20, 30, 14, 33][i % 4],
  description,
  status: i === 3 || i === 12 ? "rejected" : i % 3 === 2 ? "unpaid" : "paid",
  createdAt: `2026-11-${String(7 - Math.floor(i / 3)).padStart(2, "0")}T09:17:00Z`,
}));

// ponytail: the mock records are dated around this day. Use the server's clock once the API sends real dates.
export const AS_OF = "2026-11-07";

/** "Due in 26 days", "Due today" or "3 days overdue", counted from AS_OF. */
export function dueLabel(dueDate: string) {
  const days = Math.round((Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${AS_OF}T00:00:00Z`)) / 86_400_000);
  if (days === 0) return { text: "Due today", isOverdue: false };
  if (days < 0) return { text: `${-days} day${days === -1 ? "" : "s"} overdue`, isOverdue: true };
  return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, isOverdue: false };
}

export const TEMPLATE_LABELS = {
  "web-design": "Web Design",
  consulting: "Consulting",
  "property-management": "Property Management",
} as const;
export const CATEGORY_LABELS = {
  design: "Design",
  "professional-services": "Professional Services",
  property: "Property",
} as const;
