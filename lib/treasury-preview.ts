import type { AccrualBasis, PayoutFrequency } from "@/constant/schemas/admin-investments";
import {
  type DividendGroup,
  type ReturnScheduleForm,
  adminWithdrawalSchema,
  returnScheduleFormSchema,
} from "@/constant/schemas/admin-treasury";
import { z } from "zod";

const cents = (v: number) => Math.round(v * 100);

/** An investment that's paying returns, with the terms it was sold on. */
export interface ReturnOffering {
  id: string;
  name: string;
  units: number;
  principal: number;
  annualRate: number;
  basis: AccrualBasis;
  frequency: PayoutFrequency;
}

/** Days in an inclusive period. 30/360 caps each month at 30 days; actual/365 counts calendar days. */
export function accrualDays(periodStart: string, periodEnd: string, basis: AccrualBasis) {
  const start = new Date(`${periodStart}T00:00:00Z`);
  const end = new Date(`${periodEnd}T00:00:00Z`);
  return basis === "actual/365"
    ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    : (end.getUTCFullYear() - start.getUTCFullYear()) * 360 +
        (end.getUTCMonth() - start.getUTCMonth()) * 30 +
        Math.min(end.getUTCDate(), 30) -
        Math.min(start.getUTCDate(), 30) +
        1;
}

// Preview only: each offering accrues on its own rate and basis. Live accrual math belongs to the ledger service.
export function previewDividends(
  input: ReturnScheduleForm,
  offerings: ReturnOffering[],
  withholdingRate: number
): DividendGroup[] {
  const v = returnScheduleFormSchema.parse(input);
  return offerings
    .filter((o) => v.propertyId === "all" || o.id === v.propertyId)
    .map((o) => {
      const days = accrualDays(v.periodStart, v.periodEnd, o.basis);
      const denominator = o.basis === "actual/365" ? 365 : 360;
      const grossCents = Math.round((((cents(o.principal) * o.annualRate) / 100) * days) / denominator);
      const taxCents = Math.round((grossCents * withholdingRate) / 100);
      return { ...o, gross: grossCents / 100, tax: taxCents / 100, net: (grossCents - taxCents) / 100 };
    });
}
export function withdrawalTotals(input: z.infer<typeof adminWithdrawalSchema>[]) {
  const rows = z.array(adminWithdrawalSchema).parse(input);
  if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Duplicate withdrawal reference");
  const amount = rows.reduce((sum, r) => sum + cents(r.amount), 0);
  const fees = rows.reduce((sum, r) => sum + cents(r.fee), 0);
  return { recipients: amount / 100, fees: fees / 100, walletDebit: (amount + fees) / 100 };
}
export function csvCell(value: string | number) {
  const text = String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}
export function previewCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
