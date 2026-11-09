"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type MediaAsset, mediaAssetSchema, mediaDeskSchema } from "@/constant/schemas/admin-media";
import { MEDIA_LIMITS, type MediaType, inspectMedia, previewAssetUrl } from "@/lib/media-preview";
import { Image01Icon, Pdf01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips } from "../account/page";
import { MEDIA_DESK } from "./_data";

// One library for the whole admin: the Media page and every picker read and write this key.
const MEDIA_KEY = "citycore.admin.media.v2";
const PREVIEW_MAX = 400_000;

export const TYPE_LABEL: Record<MediaType, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "application/pdf": "PDF",
};
export const IMAGE_TYPES: MediaType[] = ["image/jpeg", "image/png", "image/webp"];

/** Sample files ship with pictures from the repo; uploads carry their own preview. */
const FIXTURE_PREVIEW: Record<string, string> = {
  "MD-01": "/assets/images/marketplace/golden-estate.png",
  "MD-02": "/assets/images/logo.png",
  "MD-04": "/assets/images/marketplace/waterfront.png",
  "MD-05": "/assets/images/marketplace/skyline.png",
  "MD-06": "/assets/images/marketplace/residences.png",
  "MD-07": "/assets/images/marketplace/city-lights.png",
  "MD-08": "/assets/images/investors/investor-avatar-01.jpg",
  "MD-10": "/assets/images/admin/publicity-hd.png",
};

export const mediaSrc = (asset: MediaAsset) => asset.preview ?? FIXTURE_PREVIEW[asset.id];

export const sizeLabel = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.ceil(bytes / 1000)} KB`;

/** Shrinks an image to a JPEG small enough to keep in browser storage. */
async function makePreview(file: File, max = 1280): Promise<string | undefined> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return undefined;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", 0.8);
  if (url.length <= PREVIEW_MAX) return url;
  return max > 640 ? makePreview(file, 640) : undefined;
}

/** Checks and converts dropped files into library assets. Bad files are reported and left out. */
export async function toAssets(files: File[]): Promise<MediaAsset[]> {
  const assets: MediaAsset[] = [];
  for (const file of files) {
    const checked = inspectMedia(file.type, file.size);
    if (!checked.ok) {
      toast.error(`${file.name}: ${checked.message}`);
      continue;
    }
    const id = `MD-${crypto.randomUUID().slice(0, 8)}`;
    const parsed = mediaAssetSchema.safeParse({
      id,
      name: file.name,
      alt: "",
      type: file.type,
      bytes: file.size,
      folder: checked.folder,
      url: previewAssetUrl(checked.folder, id),
      preview: checked.folder === "images" ? await makePreview(file) : undefined,
      updatedAt: new Date().toISOString().replace("Z", "+00:00"),
    });
    if (parsed.success) assets.push(parsed.data);
    else toast.error(parsed.error.issues[0].message);
  }
  return assets;
}

export function useMediaLibrary() {
  return usePreviewState(MEDIA_KEY, mediaDeskSchema, MEDIA_DESK);
}

export function MediaThumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  const src = mediaSrc(asset);
  if (asset.folder === "documents" || !src) {
    return (
      <div className={cn("flex aspect-4/3 flex-col justify-between bg-muted p-3", className)}>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            asset.folder === "documents" ? "bg-destructive/10 text-destructive" : "bg-card text-muted-foreground"
          )}
        >
          <HugeiconsIcon icon={asset.folder === "documents" ? Pdf01Icon : Image01Icon} aria-hidden className="size-4" />
        </span>
        <p className="line-clamp-2 text-xs font-medium">{asset.name.replace(/\.[a-z]+$/i, "")}</p>
      </div>
    );
  }
  if (src.startsWith("data:")) {
    return (
      // A saved preview. Next Image can't optimise a data address.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={asset.alt || asset.name} className={cn("aspect-4/3 w-full object-cover", className)} />
    );
  }
  return (
    <Image
      src={src}
      alt={asset.alt || asset.name}
      width={480}
      height={360}
      className={cn("aspect-4/3 w-full object-cover", className)}
    />
  );
}

function MediaPicker({
  accept,
  multiple,
  max,
  onSelect,
}: {
  accept: MediaType[];
  multiple: boolean;
  max: number;
  onSelect: (assets: MediaAsset[]) => void;
}) {
  const library = useMediaLibrary();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [folder, setFolder] = React.useState<"all" | "images" | "documents">("all");
  const [adding, setAdding] = React.useState(false);

  const usable = library.value.assets.filter((asset) => accept.includes(asset.type));
  const folders = [...new Set(usable.map((asset) => asset.folder))];
  const term = search.trim().toLowerCase();
  const shown = usable
    .filter((asset) => folder === "all" || asset.folder === folder)
    .filter((asset) => !term || `${asset.name} ${asset.alt}`.toLowerCase().includes(term));
  const limit = multiple ? max : 1;

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : multiple
          ? current.length < limit
            ? [...current, id]
            : (toast.info(`You can pick up to ${limit}`), current)
          : [id]
    );

  const upload = async (files: File[]) => {
    setAdding(true);
    const added = (await toAssets(files)).filter((asset) => accept.includes(asset.type));
    setAdding(false);
    if (!added.length) return;
    if (!library.save({ assets: [...added, ...library.value.assets] })) return;
    toast.success(added.length === 1 ? "Added to the media library" : `${added.length} files added to the library`);
    setSelected((current) => (multiple ? [...added.map((a) => a.id), ...current].slice(0, limit) : [added[0].id]));
  };

  const use = () => {
    const picked = selected.map((id) => usable.find((asset) => asset.id === id)).filter((a) => a !== undefined);
    if (!picked.length) return;
    onSelect(picked);
    AppModal.pop();
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          id="media-picker-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by file name or alt text"
          className="min-w-0 flex-1 sm:max-w-80"
          groupClassName="h-9 bg-card dark:bg-card"
        />
        {folders.length > 1 && (
          <FilterChips
            label="Folder"
            value={folder}
            onChange={setFolder}
            options={(["all", "images", "documents"] as const).map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: value === "all" ? usable.length : usable.filter((asset) => asset.folder === value).length,
            }))}
          />
        )}
        <Link
          href="/admin/media"
          onClick={() => AppModal.close()}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:ml-auto"
        >
          Manage library
        </Link>
      </div>

      {!library.ready ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <li>
            <FileUpload
              id="media-picker-upload"
              title={adding ? "Adding…" : "Upload new"}
              description="It's added to the library"
              disabled={adding}
              dropzoneClassName="h-full min-h-40"
              dropzoneAccept={Object.fromEntries(
                accept.map((type) => [type, type === "image/jpeg" ? [".jpg", ".jpeg"] : [`.${type.split("/")[1]}`]])
              )}
              dropzoneMaxSize={Math.max(...accept.map((type) => MEDIA_LIMITS[type]))}
              dropzoneMultiple={multiple}
              onFilesAdded={upload}
              onFilesRejected={() => toast.error(`Use ${accept.map((t) => TYPE_LABEL[t]).join(", ")} files`)}
            />
          </li>
          {shown.map((asset) => {
            const order = selected.indexOf(asset.id);
            const isSelected = order >= 0;
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  role={multiple ? "checkbox" : "radio"}
                  aria-checked={isSelected}
                  onClick={() => toggle(asset.id)}
                  onDoubleClick={() => {
                    if (!multiple) {
                      onSelect([asset]);
                      AppModal.pop();
                    }
                  }}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-card text-left ring-1 transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ? "ring-2 ring-foreground" : "ring-foreground/8 hover:ring-foreground/25"
                  )}
                >
                  <MediaThumb asset={asset} />
                  <span
                    className={cn(
                      "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold shadow-sm transition",
                      isSelected
                        ? "bg-foreground text-background"
                        : "bg-card/80 opacity-0 ring-1 ring-foreground/10 backdrop-blur group-hover:opacity-100"
                    )}
                  >
                    {isSelected && (multiple ? order + 1 : <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />)}
                  </span>
                  <span className="flex flex-col gap-0.5 px-3 py-2">
                    <span className="truncate text-xs font-semibold" title={asset.name}>
                      {asset.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {TYPE_LABEL[asset.type]} · {sizeLabel(asset.bytes)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {!shown.length && (
            <li className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Nothing here yet. Upload a file to add it.
            </li>
          )}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-6 mt-auto -mb-6 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <p className="text-sm text-muted-foreground tabular-nums">
          {selected.length
            ? `${selected.length} selected${multiple ? ` of ${limit}` : ""}`
            : multiple
              ? `Pick up to ${limit}`
              : "Pick one file"}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={() => AppModal.pop()}>
            Cancel
          </Button>
          <Button type="button" className="h-10 rounded-full px-5" disabled={!selected.length} onClick={use}>
            {multiple && selected.length > 1 ? `Use ${selected.length} files` : "Use file"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Opens the shared media library to pick files. Anything uploaded here is added to the library too. */
export function openMediaPicker({
  title = "Media library",
  accept = [...IMAGE_TYPES, "application/pdf"],
  multiple = false,
  max = 10,
  onSelect,
}: {
  title?: string;
  accept?: MediaType[];
  multiple?: boolean;
  max?: number;
  onSelect: (assets: MediaAsset[]) => void;
}) {
  // Pushed, not opened, so a picker launched from inside a form modal returns to that form.
  AppModal.push({
    title,
    description: `${accept.map((type) => TYPE_LABEL[type]).join(", ")}${multiple ? ` · up to ${max} files` : ""}`,
    size: "full",
    content: <MediaPicker accept={accept} multiple={multiple} max={max} onSelect={onSelect} />,
  });
}

/** A form slot showing the chosen file, with buttons to pick another from the library or clear it. */
export function MediaSlot({
  label,
  hint,
  asset,
  name,
  onPick,
  onClear,
  error,
}: {
  label: string;
  hint?: string;
  asset?: MediaAsset | null;
  /** Shown when the chosen file isn't in the library any more, such as an old saved value. */
  name?: string;
  onPick: () => void;
  onClear?: () => void;
  error?: string;
}) {
  const title = asset?.name ?? name;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      {title ? (
        <div className="flex items-center gap-3 rounded-xl border border-border p-2 pr-3">
          <span className="w-20 shrink-0 overflow-hidden rounded-lg">
            {asset ? (
              <MediaThumb asset={asset} />
            ) : (
              <span className="flex aspect-4/3 items-center justify-center bg-muted">
                <HugeiconsIcon icon={Image01Icon} aria-hidden className="size-4 text-muted-foreground" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{title}</span>
            <span className="block text-xs text-muted-foreground">
              {asset ? `${TYPE_LABEL[asset.type]} · ${sizeLabel(asset.bytes)}` : "From the media library"}
            </span>
          </span>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3" onClick={onPick}>
            Replace
          </Button>
          {onClear && (
            <Button type="button" variant="ghost" className="h-8 rounded-full px-3" onClick={onClear}>
              Remove
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
            error ? "border-destructive" : "border-border"
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Image01Icon} aria-hidden className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Choose from media library</span>
            <span className="block text-xs text-muted-foreground">{hint ?? "Pick a file or upload a new one"}</span>
          </span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
