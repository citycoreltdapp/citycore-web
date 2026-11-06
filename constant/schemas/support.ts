import { z } from "zod";

import { dateSchema, paginatedSchema, paginationQuerySchema, resourceIdSchema } from "./common";

export const helpArticleSchema = z.object({
  id: resourceIdSchema,
  category: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  body: z.array(z.string().min(1)),
  href: z
    .string()
    .regex(/^\/(?!\/)/, "Use an app-relative path")
    .nullable(),
  updatedAt: dateSchema,
});
export const helpArticlesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().max(80).optional(),
  sort: z.enum(["recent", "oldest", "title"]).default("recent"),
});
export const helpArticlesResponseSchema = paginatedSchema(helpArticleSchema);
export const helpArticleParamsSchema = z.object({ id: resourceIdSchema });
export const productGuideSchema = z.object({
  id: resourceIdSchema,
  title: z.string(),
  description: z.string(),
  articleId: resourceIdSchema.nullable(),
});
export const productGuidesResponseSchema = z.array(productGuideSchema);
export const helpDownloadResponseSchema = z.object({
  url: z.url(),
  fileName: z.string().min(1),
  mimeType: z.enum(["text/plain", "application/pdf"]),
});
export type HelpArticle = z.infer<typeof helpArticleSchema>;
