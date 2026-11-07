import {
  type DividendGroup,
  type ReturnScheduleForm,
  adminWithdrawalSchema,
  returnScheduleFormSchema,
} from "@/constant/schemas/admin-treasury";
import { z } from "zod";

const cents = (v: number) => Math.round(v * 100);
// Preview only: inclusive periods; 30/360 uses capped 30-day months. Live accrual math belongs to the ledger service.
export function previewDividends(
  input: ReturnScheduleForm,
  cohorts: { id: string; name: string; investors: number; principal: number }[]
): DividendGroup[] {
  const v = returnScheduleFormSchema.parse(input);
  const start = new Date(`${v.periodStart}T00:00:00Z`);
  const end = new Date(`${v.periodEnd}T00:00:00Z`);
  const days =
    v.basis === "actual/365"
      ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      : (end.getUTCFullYear() - start.getUTCFullYear()) * 360 +
        (end.getUTCMonth() - start.getUTCMonth()) * 30 +
        Math.min(end.getUTCDate(), 30) -
        Math.min(start.getUTCDate(), 30) +
        1;
  const denominator = v.basis === "actual/365" ? 365 : 360;
  return cohorts
    .filter((c) => v.propertyId === "all" || c.id === v.propertyId)
    .map((c) => {
      const grossCents = Math.round((((cents(c.principal) * v.annualRate) / 100) * days) / denominator);
      const taxCents = Math.round((grossCents * v.withholdingRate) / 100);
      return { ...c, gross: grossCents / 100, tax: taxCents / 100, net: (grossCents - taxCents) / 100 };
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
