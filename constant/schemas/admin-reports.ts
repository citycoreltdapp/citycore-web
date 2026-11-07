import { z } from "zod";

import { resourceIdSchema } from "./common";

export const statementFileSchema = z
  .file()
  .max(2 * 1024 * 1024)
  .refine((f) => f.name.toLowerCase().endsWith(".csv"), "Use a CSV statement up to 2 MB");
export const statementRowSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
  date: z.iso.date(),
  amount: z
    .number()
    .finite()
    .min(-1000000000)
    .max(1000000000)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, "Use two decimal places"),
  status: z.enum(["matched", "unmatched"]),
  issue: z.string(),
  owner: z.string(),
});
export const statementRowsSchema = z
  .array(statementRowSchema)
  .min(1)
  .max(2000)
  .refine((rows) => new Set(rows.map((r) => r.reference)).size === rows.length, {
    message: "Duplicate statement reference",
  });
export const reconciliationFormSchema = z.object({
  reference: resourceIdSchema,
  resolution: z.enum(["query-original", "missing-source", "request-adjustment"]),
  note: z.string().trim().min(15).max(3000),
});
export const reportExportFormSchema = z
  .object({
    dataset: z.enum(["transactions", "exceptions", "property"]),
    from: z.iso.date(),
    to: z.iso.date(),
    format: z.enum(["csv", "pdf"]),
    maskIdentifiers: z.literal(true, { error: "Identifiers must stay masked in this preview" }),
  })
  .refine((v) => v.to >= v.from, { path: ["to"], message: "End date must follow start date" });
export const reconciliationRequestSchema = reconciliationFormSchema
  .extend({ runId: resourceIdSchema, version: z.number().int().nonnegative(), idempotencyKey: z.uuid() })
  .strict();
export const reportExportRequestSchema = reportExportFormSchema
  .safeExtend({
    columns: z.array(z.enum(["reference", "date", "amount", "status", "issue", "owner"])).min(1),
    idempotencyKey: z.uuid(),
  })
  .strict();
