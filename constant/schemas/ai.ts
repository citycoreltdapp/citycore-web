import { z } from "zod";

import { paginatedSchema, paginationQuerySchema, resourceIdSchema, timestampSchema } from "./common";

export const chatLinkSchema = z.object({
  label: z.string(),
  href: z.enum([
    "/investments",
    "/marketplace",
    "/wallet",
    "/settings/security",
    "/support",
    "/ask-ai/explore",
    "/market-insights",
  ]),
});
export const chatAnswerSchema = z.object({
  topic: z.enum(["portfolio", "comparison", "wallet", "security", "market", "help"]),
  title: z.string(),
  text: z.string(),
  points: z.array(z.string()),
  links: z.array(chatLinkSchema),
  source: z.string(),
});
export type ChatAnswer = z.infer<typeof chatAnswerSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  pinned: z.boolean(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant"]),
      text: z.string(),
      answer: chatAnswerSchema.optional(),
      feedback: z.enum(["helpful", "unhelpful"]).optional(),
      feedbackReason: z.string().optional(),
    })
  ),
});
export type Conversation = z.infer<typeof conversationSchema>;
export const chatStoreSchema = z.object({
  activeId: z.string().nullable(),
  conversations: z.array(conversationSchema),
});

export const sendChatMessageRequestSchema = z.strictObject({
  conversationId: resourceIdSchema.optional(),
  text: z.string().trim().min(1, "Enter a message").max(2000, "Keep your message under 2,000 characters"),
});
export const renameConversationFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a conversation name").max(80),
});
export const updateConversationRequestSchema = z
  .strictObject({ title: renameConversationFormSchema.shape.title.optional(), pinned: z.boolean().optional() })
  .refine((v) => v.title !== undefined || v.pinned !== undefined, "Provide a title or pinned state");
export const conversationParamsSchema = z.object({ id: resourceIdSchema });
export const messageParamsSchema = z.object({ conversationId: resourceIdSchema, messageId: resourceIdSchema });
export const conversationSummarySchema = conversationSchema
  .omit({ messages: true })
  .extend({ messageCount: z.number().int().nonnegative(), lastMessage: z.string().nullable() });
export const conversationListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  pinned: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["recent", "oldest", "title"]).default("recent"),
});
export const conversationListResponseSchema = paginatedSchema(conversationSummarySchema);
export const sendChatMessageResponseSchema = z.object({ conversation: conversationSchema });
export const chatFeedbackRequestSchema = z.strictObject({
  feedback: z.enum(["helpful", "unhelpful"]).nullable(),
  reason: z.string().trim().max(500).optional(),
});
// Streaming clients can discriminate events without unsafe casts; never put provider secrets here.
export const chatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("started"), conversationId: resourceIdSchema, messageId: resourceIdSchema }),
  z.object({ type: z.literal("delta"), messageId: resourceIdSchema, text: z.string() }),
  z.object({
    type: z.literal("completed"),
    messageId: resourceIdSchema,
    answer: chatAnswerSchema,
    createdAt: timestampSchema,
  }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
]);
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;
export type RenameConversationValues = z.input<typeof renameConversationFormSchema>;
