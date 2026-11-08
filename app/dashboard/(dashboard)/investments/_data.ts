import type { Holding } from "@/constant/schemas/portfolio";

import { AS_OF } from "../_data";
import { findProperty } from "../marketplace/page";

export type { Holding } from "@/constant/schemas/portfolio";

const DAY = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);

function shiftMonths(date: string, months: number) {
  const next = new Date(utc(date));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

function holding(
  id: string,
  propertyId: string,
  units: number,
  startedMonthsAgo: number,
  status: Holding["status"] = "active"
): Holding {
  const property = findProperty(propertyId)!;
  const startDate = shiftMonths(AS_OF, -startedMonthsAgo);
  return {
    id,
    property,
    units,
    amountInvested: units * property.unitPrice,
    startDate,
    maturityDate: shiftMonths(startDate, property.tenureMonths),
    status,
  };
}

export const HOLDINGS: Holding[] = [
  holding("h_golden", "golden-estate", 10, 9),
  holding("h_palm", "palm-court", 8, 10),
  holding("h_cedar", "cedar-gardens", 15, 8),
  holding("h_marina", "marina-heights", 5, 14, "matured"),
];

const expectedReturn = (item: Holding) =>
  (item.amountInvested * item.property.targetRoi * item.property.tenureMonths) / 1200;

export const payoutAtMaturity = (item: Holding) => item.amountInvested + expectedReturn(item);

export function progress(item: Holding, asOf = AS_OF) {
  const total = Math.round((utc(item.maturityDate) - utc(item.startDate)) / DAY);
  if (item.status === "matured" || total === 0) return 1;
  const elapsed = Math.min(Math.max(Math.round((utc(asOf) - utc(item.startDate)) / DAY), 0), total);
  return elapsed / total;
}

export const accruedYield = (item: Holding, asOf = AS_OF) => expectedReturn(item) * progress(item, asOf);

export function monthsElapsed(item: Holding, asOf = AS_OF) {
  if (item.status === "matured") return item.property.tenureMonths;
  const [year, month] = asOf.split("-").map(Number);
  const [startYear, startMonth] = item.startDate.split("-").map(Number);
  return Math.min(Math.max((year - startYear) * 12 + month - startMonth, 0), item.property.tenureMonths);
}
