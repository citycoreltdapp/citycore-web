"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { Button } from "@/components/ui/button";
import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { fileExtensionLabel, formatFileSize } from "@/lib/file-info";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import {
  Add01Icon,
  Cancel01Icon,
  CloudUploadIcon,
  Delete02Icon,
  File01Icon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { type DropzoneOptions, type FileRejection, useDropzone } from "react-dropzone";

export type { FileRejection };

export type FileUploadStatus = "uploading" | "completed" | "failed";

export interface FileUploadItem {
  id: string;
  name: string;
  /** Total size in bytes. */
  size: number;
  status: FileUploadStatus;
  /** Bytes sent so far. Completed items always count as fully sent. */
  uploadedBytes?: number;
}

type DropzoneProps = Omit<DropzoneOptions, "onDrop" | "disabled" | "noClick" | "noDrag" | "noKeyboard"> & {
  className?: string;
};

interface FileUploadProps
  extends
    FieldProps,
    MixinProps<"dropzone", DropzoneProps>,
    MixinProps<"browse", Omit<React.ComponentProps<typeof Button>, "children" | "type">>,
    MixinProps<"item", Pick<React.ComponentProps<"li">, "className">> {
  /** The files to list. The parent runs the uploads and passes each file's status back in. */
  items?: FileUploadItem[];
  onFilesAdded?: (files: File[]) => void;
  /** Files refused by `dropzoneAccept`, `dropzoneMaxSize` or similar. */
  onFilesRejected?: (rejections: FileRejection[]) => void;
  /** Stop an upload in progress. */
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  browseLabel?: React.ReactNode;
  addMoreLabel?: React.ReactNode;
  disabled?: boolean;
}

export function FileUpload({
  id,
  items = [],
  onFilesAdded,
  onFilesRejected,
  onCancel,
  onRemove,
  onRetry,
  title = "Choose a file or drag & drop it here.",
  description,
  browseLabel = "Browse File",
  addMoreLabel = "Add more files",
  label,
  error,
  helpText,
  className,
  disabled = false,
  ...mixProps
}: FileUploadProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    dropzone: dropzoneProps,
    browse: browseProps,
    item: itemProps,
  } = splitProps(mixProps, ...fieldMixins, "dropzone", "browse", "item");

  const { className: dropzoneClassName, multiple = false, ...dropzoneOptions } = dropzoneProps;

  const hasItems = items.length > 0;
  const canAddFiles = !disabled && (multiple || !hasItems);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    ...dropzoneOptions,
    multiple,
    disabled: !canAddFiles,
    noClick: hasItems,
    noKeyboard: true,
    onDrop: (accepted, rejections) => {
      if (accepted.length) onFilesAdded?.(accepted);
      if (rejections.length) onFilesRejected?.(rejections);
    },
  });

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <div
        {...getRootProps()}
        data-slot="file-upload"
        className={cn(
          "rounded-lg border-[1.5px] border-dashed border-accent transition-colors",
          hasItems ? "flex flex-col gap-4 p-5" : "flex flex-col items-center px-6 py-10 text-center",
          !hasItems && !disabled && "cursor-pointer hover:bg-accent/5",
          isDragActive && "bg-accent/5 ring-3 ring-accent/20",
          (isDragReject || error) && "border-destructive",
          isDragReject && "bg-destructive/5 ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50",
          dropzoneClassName
        )}
      >
        <input
          {...getInputProps({ id })}
          aria-label={typeof label === "string" ? undefined : "Upload file"}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
        />

        {hasItems ? (
          <>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <FileUploadRow
                  key={item.id}
                  item={item}
                  className={itemProps.className}
                  onCancel={onCancel}
                  onRemove={onRemove}
                  onRetry={onRetry}
                />
              ))}
            </ul>
            {multiple && (
              <Button type="button" variant="ghost" className="self-center" disabled={disabled} onClick={open}>
                <HugeiconsIcon icon={Add01Icon} />
                {addMoreLabel}
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-xl bg-card shadow-sm">
              <HugeiconsIcon icon={CloudUploadIcon} aria-hidden className="size-6 text-foreground" />
            </span>
            <p className="mt-5 text-base font-medium text-foreground">{title}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            <Button
              {...browseProps}
              type="button"
              variant="outline"
              size="lg"
              className={cn("mt-5 px-4", browseProps.className)}
              disabled={disabled}
            >
              {browseLabel}
            </Button>
          </>
        )}
      </div>
    </FieldShell>
  );
}

const STATUS_LABELS: Record<FileUploadStatus, string> = {
  uploading: "Uploading ...",
  completed: "Completed",
  failed: "Failed",
};

function FileUploadRow({
  item,
  className,
  onCancel,
  onRemove,
  onRetry,
}: {
  item: FileUploadItem;
  className?: string;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const { id, name, size, status } = item;
  const uploaded = status === "completed" ? size : Math.min(item.uploadedBytes ?? 0, size);
  const percent = size > 0 ? Math.round((uploaded / size) * 100) : 0;
  const failed = status === "failed";

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4",
        failed && "border-destructive bg-destructive/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <FileTypeIcon name={name} />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p title={name} className="truncate text-sm font-medium text-foreground">
            {name}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>
              {formatFileSize(uploaded)} of {formatFileSize(size)}
            </span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span role="status" className="inline-flex items-center gap-1.5 text-foreground">
              <StatusIcon status={status} />
              {STATUS_LABELS[status]}
            </span>
          </div>
          {failed && onRetry && (
            <button
              type="button"
              className="w-fit cursor-pointer rounded-sm text-sm font-medium text-destructive underline underline-offset-3 outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
              onClick={() => onRetry(id)}
            >
              Try Again
            </button>
          )}
        </div>

        {status === "uploading" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Cancel upload of ${name}`}
            onClick={() => onCancel?.(id)}
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${name}`}
            className={cn(failed && "text-destructive hover:text-destructive")}
            onClick={() => onRemove?.(id)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        )}
      </div>

      {status === "uploading" && (
        <ProgressPrimitive.Root value={percent} aria-label={`Uploading ${name}`}>
          <ProgressTrack className="h-1.5">
            {/* The white ticks split the filled part into segments. */}
            <ProgressIndicator className="bg-chart-4 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_80px,var(--card)_80px,var(--card)_82px)]" />
          </ProgressTrack>
        </ProgressPrimitive.Root>
      )}
    </li>
  );
}

function FileTypeIcon({ name }: { name: string }) {
  return (
    <span aria-hidden className="relative flex size-11 shrink-0 items-center justify-center">
      <HugeiconsIcon icon={File01Icon} strokeWidth={1.25} className="size-11 text-muted-foreground/50" />
      <span className="absolute bottom-1 left-0 rounded-[3px] bg-destructive px-1 py-px text-[9px] leading-tight font-bold text-white">
        {fileExtensionLabel(name)}
      </span>
    </span>
  );
}

function StatusIcon({ status }: { status: FileUploadStatus }) {
  if (status === "uploading")
    return <HugeiconsIcon icon={Loading03Icon} aria-hidden className="size-4 animate-spin text-accent" />;

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 items-center justify-center rounded-full text-white",
        status === "completed" ? "bg-chart-4" : "bg-destructive"
      )}
    >
      {status === "completed" ? (
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-2.5" />
      ) : (
        <span className="text-[11px] leading-none font-bold">i</span>
      )}
    </span>
  );
}
