import { z } from "zod";

import {
  amountSchema,
  paginatedSchema,
  paginationQuerySchema,
  positiveAmountSchema,
  resourceIdSchema,
  searchSchema,
  timestampSchema,
} from "./common";

export const adminAccountStatusSchema = z.enum(["successful", "pending", "cancelled"]);
export const adminAccountTransactionSchema = z.object({
  id: resourceIdSchema,
  title: z.string().min(1),
  invoiceNumber: z.string().min(1),
  medium: z.string().min(1),
  amount: positiveAmountSchema,
  direction: z.enum(["credit", "debit"]),
  status: adminAccountStatusSchema,
  createdAt: timestampSchema,
});
export const adminInvoiceStatusSchema = z.enum(["draft", "paid", "unpaid", "rejected"]);
export const adminInvoiceFormSchema = z
  .object({
    template: z.enum(["web-design", "consulting", "property-management"]),
    category: z.enum(["design", "professional-services", "property"]),
    invoiceNumber: z
      .string()
      .trim()
      .min(1, "Enter an invoice number")
      .max(40)
      .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers and hyphens"),
    dueDate: z.iso.date({ error: "Select a valid due date" }),
    companyName: z.string().trim().min(2, "Enter a company name").max(160),
    address: z.string().trim().min(5, "Enter the company address").max(500),
    email: z.email("Enter a valid contact email"),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a contact number")
      .max(25)
      .regex(/^\+?[\d ()-]+$/, "Enter a valid contact number"),
    amount: positiveAmountSchema,
    rate: z.number().finite().min(0).max(100),
    description: z.string().trim().min(3, "Describe the service").max(2000),
  })
  .strict();
export const adminInvoiceSchema = adminInvoiceFormSchema.extend({
  id: resourceIdSchema,
  status: adminInvoiceStatusSchema,
  createdAt: timestampSchema,
});
export const createAdminInvoiceRequestSchema = adminInvoiceFormSchema.extend({
  intent: z.enum(["draft", "send"]),
  idempotencyKey: z.uuid(),
});
export const updateAdminInvoiceRequestSchema = z
  .object({ status: adminInvoiceStatusSchema, version: z.number().int().nonnegative() })
  .strict();
export const adminInvoicesQuerySchema = paginationQuerySchema.extend({
  search: searchSchema.optional(),
  status: adminInvoiceStatusSchema.optional(),
  sort: z.enum(["recent", "oldest"]).default("recent"),
});
export const adminInvoicesResponseSchema = paginatedSchema(adminInvoiceSchema);
export const adminAccountTransactionsResponseSchema = paginatedSchema(adminAccountTransactionSchema);
export const adminAccountSummarySchema = z.object({
  balance: amountSchema,
  deposits: amountSchema,
  pending: amountSchema,
  failed: amountSchema,
});
export type AdminInvoice = z.infer<typeof adminInvoiceSchema>;
export type AdminInvoiceForm = z.infer<typeof adminInvoiceFormSchema>;
export type AdminAccountTransaction = z.infer<typeof adminAccountTransactionSchema>;
