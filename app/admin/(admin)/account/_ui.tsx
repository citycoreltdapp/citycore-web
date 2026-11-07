"use client";

import * as React from "react";

import { cn } from "cn";

export type Tone = "success" | "warning" | "danger" | "muted";

const TONE_STYLES: Record<Tone, { pill: string; dot: string; bar: string }> = {
  success: { pill: "bg-success/12 text-success", dot: "bg-success", bar: "bg-success" },
  warning: { pill: "bg-warning/12 text-warning", dot: "bg-warning", bar: "bg-warning" },
  danger: { pill: "bg-destructive/10 text-destructive", dot: "bg-destructive", bar: "bg-destructive" },
  muted: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", bar: "bg-muted-foreground/50" },
};

export const toneBar = (tone: Tone) => TONE_STYLES[tone].bar;
export const toneDot = (tone: Tone) => TONE_STYLES[tone].dot;

export const TRANSACTION_TONES = { successful: "success", pending: "warning", cancelled: "danger" } as const;
export const INVOICE_TONES = { paid: "success", unpaid: "warning", rejected: "danger", draft: "muted" } as const;

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold capitalize",
        TONE_STYLES[tone].pill
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", TONE_STYLES[tone].dot)} />
      {children}
    </span>
  );
}

/** A row of filter pills, each showing how many rows it would leave. */
export function FilterChips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  isActive ? "bg-foreground text-background" : "bg-background/70"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A thin bar split into coloured parts by value. */
export function SegmentBar({
  parts,
  className,
}: {
  parts: { key: string; value: number; className: string }[];
  className?: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div aria-hidden className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full", className)}>
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <span
            key={part.key}
            className={cn("h-full rounded-full transition-[flex-grow] duration-500", part.className)}
            style={{ flexGrow: part.value / total }}
          />
        ))}
    </div>
  );
}

// Formatted in UTC so the server and the browser print the same thing.
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
export const formatDate = (iso: string) => DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
export const formatTime = (iso: string) => TIME.format(new Date(iso));

/**
 * Downloads rows as a CSV file. Values are quoted so commas survive, and text starting with = + or @ gets a
 * leading apostrophe so a spreadsheet can't run it as a formula.
 */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = typeof value === "string" && /^[=+@\t\r]/.test(value) ? `'${value}` : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
