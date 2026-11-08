import { z } from "zod";

import { resourceIdSchema, timestampSchema } from "./common";

export const blogRoleSchema = z.enum(["editor", "media-publicity"]);
export const postStatusSchema = z.enum(["draft", "published", "archived"]);
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase web address");

export const blogPostSchema = z.object({
  id: resourceIdSchema,
  title: z.string().trim().min(1, "Add a title").max(160),
  slug,
  excerpt: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1, "Write the post").max(20000),
  category: z.string().trim().min(1).max(40),
  tags: z.array(z.string().trim().min(1).max(24)).max(8),
  coverName: z.string().trim().max(180).optional(),
  coverUrl: z.url().optional(),
  status: postStatusSchema,
  updatedAt: timestampSchema,
});
export const blogDeskSchema = z.object({
  role: blogRoleSchema,
  posts: z.array(blogPostSchema),
});
export const blogPublishRequestSchema = z
  .object({ role: blogRoleSchema, status: z.literal("published") })
  .refine((value) => value.role === "editor", { message: "Media & Publicity can only save drafts" });

export type BlogDesk = z.infer<typeof blogDeskSchema>;
export type BlogPost = z.infer<typeof blogPostSchema>;
export type BlogRole = z.infer<typeof blogRoleSchema>;
