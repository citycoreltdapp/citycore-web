import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { fn } from "storybook/test";

import { FileUpload, type FileUploadItem } from "./file-upload";

const KB = 1024;

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
  "video/mp4": [".mp4"],
};

const meta = {
  title: "Primitives/FileUpload",
  component: FileUpload,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    id: "file-upload",
    description: "JPEG, PNG, PDF, and MP4 formats, up to 50 MB.",
    onFilesAdded: fn(),
    onFilesRejected: fn(),
    onCancel: fn(),
    onRemove: fn(),
    onRetry: fn(),
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    browseLabel: { control: "text" },
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const FileStates: Story = {
  args: {
    items: [
      { id: "1", name: "example.pdf", size: 120 * KB, status: "uploading", uploadedBytes: 84 * KB },
      { id: "2", name: "example.pdf", size: 120 * KB, status: "completed" },
      { id: "3", name: "example.pdf", size: 120 * KB, status: "failed", uploadedBytes: 0 },
    ],
  },
};

export const Uploading: Story = {
  args: { items: [{ id: "1", name: "example.pdf", size: 120 * KB, status: "uploading", uploadedBytes: 84 * KB }] },
};

export const Completed: Story = {
  args: { items: [{ id: "1", name: "contract.pdf", size: 2.4 * KB * KB, status: "completed" }] },
};

export const Failed: Story = {
  args: { items: [{ id: "1", name: "example.pdf", size: 120 * KB, status: "failed", uploadedBytes: 0 }] },
};

export const OtherFileTypes: Story = {
  args: {
    items: [
      { id: "1", name: "photo.png", size: 840 * KB, status: "completed" },
      { id: "2", name: "demo.mp4", size: 38 * KB * KB, status: "completed" },
      { id: "3", name: "notes", size: 12 * KB, status: "completed" },
      {
        id: "4",
        name: "a-very-long-file-name-that-should-be-cut-off-instead-of-pushing-the-buttons-off-the-card-at-narrow-widths.pdf",
        size: 120 * KB,
        status: "completed",
      },
    ],
  },
};

export const WithLabelAndHelpText: Story = {
  args: { label: "Supporting documents", helpText: "Add your latest bank statement." },
};

export const WithError: Story = {
  args: { label: "Supporting documents", error: "Please add at least one document." },
};

export const Disabled: Story = { args: { disabled: true } };

export const WithMixins: Story = {
  args: {
    dropzoneClassName: "border-primary",
    browseVariant: "default",
    labelClassName: "text-primary",
    label: "Custom styling",
  },
};

/** Simulated uploads. A file with "fail" in its name stops at 60%, so you can try the retry. */
const UploadDemo = (args: React.ComponentProps<typeof FileUpload>) => {
  const [items, setItems] = React.useState<FileUploadItem[]>([]);
  const [error, setError] = React.useState<string>();

  const uploading = items.some((item) => item.status === "uploading");

  React.useEffect(() => {
    if (!uploading) return;

    const timer = setInterval(() => {
      setItems((current) =>
        current.map((item) => {
          if (item.status !== "uploading") return item;

          const uploadedBytes = (item.uploadedBytes ?? 0) + item.size / 10;
          if (item.name.includes("fail") && uploadedBytes >= item.size * 0.6) return { ...item, status: "failed" };
          return uploadedBytes >= item.size ? { ...item, status: "completed" } : { ...item, uploadedBytes };
        })
      );
    }, 300);

    return () => clearInterval(timer);
  }, [uploading]);

  return (
    <FileUpload
      {...args}
      items={items}
      error={error}
      onFilesAdded={(files) => {
        setError(undefined);
        setItems((current) => [
          ...current,
          ...files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            status: "uploading" as const,
            uploadedBytes: 0,
          })),
        ]);
      }}
      onFilesRejected={(rejections) => setError(rejections[0].errors[0].message)}
      onCancel={(id) => {
        setItems((current) => current.filter((item) => item.id !== id));
        toast("Upload cancelled");
      }}
      onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      onRetry={(id) =>
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, name: item.name.replace("fail", "ok"), status: "uploading", uploadedBytes: 0 }
              : item
          )
        )
      }
    />
  );
};

export const SimulatedUpload: Story = {
  args: {
    dropzoneMultiple: true,
    dropzoneAccept: ACCEPTED_TYPES,
    dropzoneMaxSize: 50 * KB * KB,
  },
  render: (args) => <UploadDemo {...args} />,
};
