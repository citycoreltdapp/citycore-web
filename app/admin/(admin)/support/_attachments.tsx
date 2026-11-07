"use client";
import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { Button } from "@/components/ui/button";
import { supportAttachmentFileSchema, supportAttachmentSchema } from "@/constant/schemas/admin-support";
import { Attachment01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { z } from "zod";

export type Attachment = z.infer<typeof supportAttachmentSchema>;

function openUpload(files: Attachment[], onChange: (files: Attachment[]) => void) {
  AppModal.open({
    title: "Attach evidence",
    description: "PDF, JPG or PNG · 10 MB each · up to 5 files",
    content: (
      <div className="space-y-4">
        <FileUpload
          id="support-evidence-upload"
          dropzoneMultiple
          dropzoneMaxFiles={5 - files.length}
          dropzoneMaxSize={10 * 1024 * 1024}
          disabled={files.length >= 5}
          dropzoneAccept={{
            "application/pdf": [".pdf"],
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
          }}
          onFilesRejected={() => toast.error("Use up to 5 PDF, PNG or JPG files, each under 10 MB")}
          onFilesAdded={(added) => {
            const next: Attachment[] = [];
            for (const file of added) {
              const parsed = supportAttachmentFileSchema.safeParse(file);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                continue;
              }
              const meta = supportAttachmentSchema.safeParse({ name: file.name, size: file.size, type: file.type });
              if (meta.success) next.push(meta.data);
            }
            onChange([...files, ...next].slice(0, 5));
            AppModal.close();
          }}
        />
        <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs/5 text-muted-foreground">
          Never attach passwords, PINs or OTPs. Only file names and sizes are kept; nothing is uploaded.
        </p>
      </div>
    ),
  });
}

export function AttachButton({
  files,
  onChange,
  label = "Attach",
}: {
  files: Attachment[];
  onChange: (files: Attachment[]) => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 rounded-full px-3 text-muted-foreground"
      disabled={files.length >= 5}
      onClick={() => openUpload(files, onChange)}
    >
      <HugeiconsIcon icon={Attachment01Icon} aria-hidden />
      {label}
    </Button>
  );
}

export function AttachmentChips({
  files,
  onChange,
}: {
  files: Attachment[];
  onChange?: (files: Attachment[]) => void;
}) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {files.map((file, i) => (
        <li
          key={`${file.name}-${i}`}
          className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs"
        >
          <HugeiconsIcon icon={Attachment01Icon} aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">{Math.ceil(file.size / 1024)} KB</span>
          {onChange && (
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onChange(files.filter((_, index) => index !== i))}
              className="-mr-1 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden className="size-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
