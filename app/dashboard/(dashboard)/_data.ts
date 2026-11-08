// ponytail: same figures as the mobile HomeMockData.dashboard(). Replace with fromApi(homeDashboardSchema, GET /dashboard).
import type { ChartRange, HomeDashboard } from "@/constant/schemas/dashboard";

import { TRANSACTIONS } from "./transactions/_data";

export type { ChartRange, HomeDashboard } from "@/constant/schemas/dashboard";

/** Fixed "today" for sample data, so prerendered pages never read the clock. */
export const AS_OF = "2026-11-08";

/** Mobile `MockProfile`: the signed-in investor's name. */
export const PROFILE = { firstName: "Ada", lastName: "Okafor" };

export const HOME_DASHBOARD: HomeDashboard = {
  firstName: PROFILE.firstName,
  kycStatus: "notStarted",
  walletBalance: 1_250_000,
  portfolioValue: 5_630_000,
  accruedYield: 630_000,
  activeInvestments: 3,
  averageYield: 16.4,
  nextPayout: "2026-12-01T00:00:00+01:00",
  unreadNotifications: 2,
  portfolioHistory: {
    oneMonth: [5.38, 5.41, 5.4, 5.46, 5.44, 5.5, 5.53, 5.52, 5.58, 5.62],
    threeMonths: [5.0, 5.08, 5.05, 5.17, 5.21, 5.19, 5.33, 5.4, 5.47, 5.62],
    sixMonths: [4.2, 4.35, 4.3, 4.6, 4.72, 4.9, 4.96, 5.2, 5.38, 5.62],
    oneYear: [2.0, 2.4, 2.35, 3.1, 3.05, 3.6, 3.9, 4.4, 4.9, 5.2, 5.62],
  },
  recentTransactions: TRANSACTIONS.filter((tx) => /^tx_[1-5]$/.test(tx.id)),
};

/** Same getter as the mobile model. */
export const totalBalance = (dashboard: HomeDashboard) => dashboard.walletBalance + dashboard.portfolioValue;

export const CHART_RANGES: { value: ChartRange; label: string; months: number }[] = [
  { value: "oneMonth", label: "1M", months: 1 },
  { value: "threeMonths", label: "3M", months: 3 },
  { value: "sixMonths", label: "6M", months: 6 },
  { value: "oneYear", label: "1Y", months: 12 },
];

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** The API sends bare values (in millions), evenly spaced and ending today; this adds the dates for the chart axis. */
export function portfolioSeries(dashboard: HomeDashboard, range: ChartRange) {
  const values = dashboard.portfolioHistory[range] ?? [];
  const months = CHART_RANGES.find((r) => r.value === range)!.months;
  const end = Date.parse(`${AS_OF}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - months);
  const step = values.length > 1 ? (end - start.getTime()) / (values.length - 1) : 0;
  return values.map((value, index) => ({
    period: SHORT_DATE.format(start.getTime() + step * index),
    value: value * 1_000_000,
  }));
}
