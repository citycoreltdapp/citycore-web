import { z } from "zod";

import { paginatedSchema, paginationQuerySchema, resourceIdSchema, timestampSchema } from "./common";

export const supportAttachmentFileSchema = z
  .file()
  .mime(["application/pdf", "image/png", "image/jpeg"])
  .max(10 * 1024 * 1024);
export const supportAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(10 * 1024 * 1024),
  type: z.enum(["application/pdf", "image/png", "image/jpeg"]),
});
export const adminTicketFormSchema = z.object({
  category: z.enum(["transactions", "verification", "account", "other"]),
  transactionReference: z.string().trim().max(128),
  subject: z.string().trim().min(5).max(160),
  details: z.string().trim().min(15).max(5000),
});
export const adminReplyFormSchema = z.object({ message: z.string().trim().min(2, "Enter a reply").max(5000) });
export const ticketMessageSchema = z.object({
  id: resourceIdSchema,
  author: z.string(),
  body: z.string().min(1).max(5000),
  createdAt: timestampSchema,
  local: z.boolean(),
  attachments: z.array(supportAttachmentSchema).max(5),
});
export const adminTicketSchema = adminTicketFormSchema.extend({
  id: resourceIdSchema,
  status: z.enum(["in-progress", "awaiting-reply", "resolved"]),
  createdAt: timestampSchema,
  messages: z.array(ticketMessageSchema),
});
export const supportNotificationSchema = z.object({
  id: resourceIdSchema,
  title: z.string(),
  body: z.string(),
  target: z.enum(["verification", "ticket", "transaction"]),
  reference: resourceIdSchema,
  isRead: z.boolean(),
});
export const adminSupportStateSchema = z.object({
  tickets: z.array(adminTicketSchema),
  notifications: z.array(supportNotificationSchema),
});
export const createAdminTicketRequestSchema = adminTicketFormSchema
  .extend({ attachmentIds: z.array(resourceIdSchema).max(5), idempotencyKey: z.uuid() })
  .strict();
export const replyAdminTicketRequestSchema = adminReplyFormSchema
  .extend({
    ticketId: resourceIdSchema,
    attachmentIds: z.array(resourceIdSchema).max(5),
    version: z.number().int().nonnegative(),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const adminTicketsQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(200).optional(),
  status: z.enum(["in-progress", "awaiting-reply", "resolved"]).optional(),
});
export const adminTicketsResponseSchema = paginatedSchema(adminTicketSchema);
