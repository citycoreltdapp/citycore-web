"use client";
import { useRef } from "react";

import { TextAreaField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  QuoteDownIcon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const TOOLS = [
  { label: "Bold", icon: TextBoldIcon, before: "**", after: "**" },
  { label: "Italic", icon: TextItalicIcon, before: "_", after: "_" },
  { label: "Bullet list", icon: LeftToRightListBulletIcon, before: "\n- ", after: "" },
  { label: "Numbered list", icon: LeftToRightListNumberIcon, before: "\n1. ", after: "" },
  { label: "Quote", icon: QuoteDownIcon, before: "\n> ", after: "" },
  { label: "Link", icon: Link01Icon, before: "[", after: "](https://)" },
];

export function TaglineField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = "") => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    if (next.length > 500) return;
    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + before.length, end + before.length);
    });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="profile-tagline">Tagline</Label>
      <div className="overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <div
          role="toolbar"
          aria-label="Tagline formatting"
          className="flex flex-wrap gap-0.5 border-b border-border p-1"
        >
          {TOOLS.map(({ label, icon, before, after }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              onClick={() => insert(before, after)}
            >
              <HugeiconsIcon icon={icon} aria-hidden />
            </Button>
          ))}
        </div>
        <TextAreaField
          ref={ref}
          id="profile-tagline"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={500}
          placeholder="Write a little about yourself"
          error={error}
          errorClassName="px-3 pb-2"
          textareaClassName="min-h-28 rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <p className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
        <span>Formatting uses Markdown</span>
        <span>{value.length}/500</span>
      </p>
    </div>
  );
}
