"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MediaAsset } from "@/constant/schemas/admin-media";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { FilterChips, formatDate } from "../account/page";
import { MediaThumb, TYPE_LABEL, sizeLabel, toAssets, useMediaLibrary } from "./_library";

const folders = ["all", "images", "documents"] as const;

export default function MediaPage() {
  const desk = useMediaLibrary();
  const [folder, setFolder] = React.useState<(typeof folders)[number]>("all");

  const assets = desk.value.assets.filter((asset) => folder === "all" || asset.folder === folder);

  const save = (next: MediaAsset[], message: string) => {
    if (desk.save({ assets: next })) toast.success(message);
  };

  const onFiles = async (files: File[]) => {
    const added = await toAssets(files);
    if (added.length)
      save([...added, ...desk.value.assets], added.length === 1 ? "File added" : `${added.length} files added`);
  };

  const remove = (asset: MediaAsset) =>
    save(
      desk.value.assets.filter((item) => item.id !== asset.id),
      "File removed"
    );

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
                <MediaThumb asset={asset} />
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
