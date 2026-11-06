import type { Holding } from "@/constant/schemas/portfolio";

export type { Holding } from "@/constant/schemas/portfolio";

// Illustrative holdings; use portfolio records from the API when it is connected.
export const HOLDINGS = [
  {
    id: "holding-golden",
    investmentId: "golden-estate",
    principal: 3_000_000,
    accruedYield: 390_000,
    units: 20,
    elapsedMonths: 8,
    tenure: 12,
    status: "active",
    allocatedAt: "2026-03-01",
    maturityDate: "2027-03-01",
  },
  {
    id: "holding-silver",
    investmentId: "silver-city",
    principal: 2_000_000,
    accruedYield: 230_000,
    units: 16,
    elapsedMonths: 8,
    tenure: 12,
    status: "active",
    allocatedAt: "2026-03-15",
    maturityDate: "2027-03-15",
  },
] as const satisfies readonly Holding[];
export const PORTFOLIO_HISTORY = [
  { month: "Jan", value: 4_800_000 },
  { month: "Feb", value: 4_950_000 },
  { month: "Mar", value: 5_000_000 },
  { month: "Apr", value: 5_150_000 },
  { month: "May", value: 5_090_000 },
  { month: "Jun", value: 5_240_000 },
  { month: "Jul", value: 5_300_000 },
  { month: "Aug", value: 5_410_000 },
  { month: "Sep", value: 5_490_000 },
  { month: "Oct", value: 5_620_000 },
];
