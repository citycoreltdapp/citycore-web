"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type MediaAsset, mediaDeskSchema } from "@/constant/schemas/admin-media";
import { inspectMedia, previewAssetUrl } from "@/lib/media-preview";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { toast } from "sonner";

import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips, formatDate } from "../account/page";
import { MEDIA_DESK } from "./_data";

const folders = ["all", "images", "documents"] as const;

const TYPE_LABEL = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "application/pdf": "PDF",
} as const;

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

const sizeLabel = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.ceil(bytes / 1000)} KB`;

export default function MediaPage() {
  // shortcut: a new key so this set shows even if the browser kept the old three-file copy.
  const desk = usePreviewState("citycore.admin.media.v2", mediaDeskSchema, MEDIA_DESK);
  const [folder, setFolder] = React.useState<(typeof folders)[number]>("all");
  const [local, setLocal] = React.useState<Record<string, string>>({});
  const localRef = React.useRef(local);

  React.useEffect(() => {
    return () => {
      Object.values(localRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const assets = desk.value.assets.filter((asset) => folder === "all" || asset.folder === folder);

  const save = (next: MediaAsset[], message: string) => {
    if (desk.save({ assets: next })) toast.success(message);
  };

  const onFiles = (files: File[]) => {
    const added: MediaAsset[] = [];
    const previews: Record<string, string> = {};
    files.forEach((file, index) => {
      const checked = inspectMedia(file.type, file.size);
      if (!checked.ok) {
        toast.error(checked.message);
        return;
      }
      const id = `MD-${Date.now().toString().slice(-6)}${index}`;
      const parsed = mediaDeskSchema.shape.assets.element.safeParse({
        id,
        name: file.name,
        alt: "",
        type: file.type,
        bytes: file.size,
        folder: checked.folder,
        url: previewAssetUrl(checked.folder, id),
        updatedAt: "2026-11-08T12:00:00+01:00",
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      added.push(parsed.data);
      if (checked.folder === "images") previews[id] = URL.createObjectURL(file);
    });
    if (!added.length) return;
    localRef.current = { ...previews, ...localRef.current };
    setLocal(localRef.current);
    save([...added, ...desk.value.assets], added.length === 1 ? "File added" : `${added.length} files added`);
  };

  const remove = (asset: MediaAsset) => {
    const url = localRef.current[asset.id];
    if (url) URL.revokeObjectURL(url);
    const next = { ...localRef.current };
    delete next[asset.id];
    localRef.current = next;
    setLocal(next);
    save(
      desk.value.assets.filter((item) => item.id !== asset.id),
      "File removed"
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {desk.value.assets.length} files. JPEG, PNG and WebP up to 5 MB. PDF up to 10 MB.
          </p>
        </div>
        <FilterChips
          label="Media folder"
          value={folder}
          onChange={setFolder}
          options={folders.map((value) => ({
            value,
            label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
            count:
              value === "all"
                ? desk.value.assets.length
                : desk.value.assets.filter((asset) => asset.folder === value).length,
          }))}
        />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <FileUpload
            id="media-library-upload"
            title="Drop a file"
            description="It shows up here as a card."
            dropzoneClassName="h-full min-h-64"
            dropzoneAccept={{
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
              "application/pdf": [".pdf"],
            }}
            dropzoneMaxSize={10_000_000}
            dropzoneMultiple
            onFilesAdded={onFiles}
            onFilesRejected={() => toast.error("Use a JPEG, PNG, WebP or PDF up to 10 MB")}
          />
        </li>
        {assets.map((asset) => (
          <li key={asset.id}>
            <Card className="group h-full gap-0 overflow-hidden rounded-2xl py-0 ring-foreground/8">
              <div className="relative bg-muted">
                <MediaPreview asset={asset} localSrc={local[asset.id]} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Remove ${asset.name}`}
                  className="absolute top-2.5 right-2.5 bg-card opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                  onClick={() =>
                    AppModal.confirm({
                      title: "Delete this file?",
                      description: `${asset.name} will be removed from this library.`,
                      confirmLabel: "Delete",
                      onConfirm: () => remove(asset),
                    })
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
                <p title={asset.name} className="truncate text-sm font-semibold">
                  {asset.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABEL[asset.type]} · {sizeLabel(asset.bytes)} · {formatDate(asset.updatedAt)}
                </p>
                <input
                  aria-label={asset.folder === "images" ? `Alt text for ${asset.name}` : `Note for ${asset.name}`}
                  value={asset.alt}
                  placeholder={asset.folder === "images" ? "Alt text" : "Note"}
                  onChange={(event) =>
                    desk.save({
                      assets: desk.value.assets.map((item) =>
                        item.id === asset.id ? { ...item, alt: event.target.value } : item
                      ),
                    })
                  }
                  className="mt-auto w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaPreview({ asset, localSrc }: { asset: MediaAsset; localSrc?: string }) {
  if (asset.folder === "documents") {
    return (
      <div className="flex aspect-4/3 flex-col justify-between p-4">
        <span className="w-fit rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
        <p className="line-clamp-3 text-sm leading-5 font-medium">{asset.name.replace(/\.pdf$/i, "")}</p>
      </div>
    );
  }

  const src = localSrc ?? FIXTURE_PREVIEW[asset.id];
  if (!src) return <div className="aspect-4/3" />;
  if (src.startsWith("blob:")) {
    return (
      // Local file preview. Next Image cannot take a blob address.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={asset.alt || asset.name} className="aspect-4/3 w-full object-cover" />
    );
  }
  return (
    <Image
      src={src}
      alt={asset.alt || asset.name}
      width={640}
      height={480}
      className="aspect-4/3 w-full object-cover"
    />
  );
}
