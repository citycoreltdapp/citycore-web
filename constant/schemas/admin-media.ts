import { z } from "zod";

import { resourceIdSchema, timestampSchema } from "./common";

export const mediaFolderSchema = z.enum(["images", "documents"]);
export const mediaAssetSchema = z.object({
  id: resourceIdSchema,
  name: z.string().trim().min(1).max(180),
  alt: z.string().trim().max(180),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  bytes: z.number().int().positive(),
  folder: mediaFolderSchema,
  url: z.url(),
  /**
   * A downscaled copy kept in the browser so uploads stay visible and usable as covers. Goes away once the upload
   * API returns real asset URLs.
   */
  preview: z
    .string()
    .max(400_000)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, "Use a valid image preview")
    .optional(),
  updatedAt: timestampSchema,
});
export const mediaDeskSchema = z.object({ assets: z.array(mediaAssetSchema) });
export type MediaDesk = z.infer<typeof mediaDeskSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
