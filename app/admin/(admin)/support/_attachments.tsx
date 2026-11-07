"use client";
import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { Button } from "@/components/ui/button";
import { supportAttachmentFileSchema, supportAttachmentSchema } from "@/constant/schemas/admin-support";
import { toast } from "sonner";
import { z } from "zod";

import { Notice } from "../_operations/ui";

export type Attachment = z.infer<typeof supportAttachmentSchema>;
export function AttachmentControl({
  files,
  onChange,
  label = "Attach file",
}: {
  files: Attachment[];
  onChange: (files: Attachment[]) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          AppModal.open({
            title: "Attach support evidence",
            content: (
              <div className="space-y-4">
                <Notice>
                  PDF, JPG or PNG · 10 MB per file · up to 5 attachments. Never attach passwords, PINs or OTPs. This
                  preview saves file metadata only; no file is uploaded.
                </Notice>
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
                      const meta = supportAttachmentSchema.safeParse({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      });
                      if (meta.success) next.push(meta.data);
                    }
                    onChange([...files, ...next].slice(0, 5));
                    AppModal.close();
                  }}
                />
              </div>
            ),
          })
        }
      >
        {label}
      </Button>
      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2 text-xs"
        >
          <span className="truncate">
            {file.name} · {Math.ceil(file.size / 1024)} KB · local metadata
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${file.name}`}
            type="button"
            onClick={() => onChange(files.filter((_, index) => index !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
