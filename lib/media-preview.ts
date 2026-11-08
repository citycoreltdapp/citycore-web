export const MEDIA_LIMITS = {
  "image/jpeg": 5_000_000,
  "image/png": 5_000_000,
  "image/webp": 5_000_000,
  "application/pdf": 10_000_000,
} as const;

export type MediaType = keyof typeof MEDIA_LIMITS;

export const inspectMedia = (type: string, bytes: number) => {
  const limit = MEDIA_LIMITS[type as MediaType];
  if (!limit) return { ok: false as const, message: "Use a JPEG, PNG, WebP or PDF" };
  if (bytes > limit) return { ok: false as const, message: `That file is over ${limit / 1_000_000} MB` };
  if (bytes <= 0) return { ok: false as const, message: "That file is empty" };
  return { ok: true as const, folder: type === "application/pdf" ? ("documents" as const) : ("images" as const) };
};

export const previewAssetUrl = (folder: "images" | "documents", id: string) =>
  `https://res.cloudinary.com/citycore-preview/${folder}/upload/v1/${id}`;
