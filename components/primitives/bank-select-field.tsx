"use client";

import * as React from "react";

import { ResourceField, ResourceFieldItem } from "@/components/primitives/resource-field";
import { NIGERIAN_BANKS, type NigerianBank } from "@/constant/nigerian-banks";
import { cn } from "cn";

const GROUP_ORDER: NigerianBank["group"][] = [
  "Popular",
  "Banks",
  "Payment service banks & wallets",
  "Microfinance banks",
  "Mortgage banks",
  "Finance companies",
];
const BANKS = NIGERIAN_BANKS.toSorted(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name)
);

const initials = (name: string) => {
  const words = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length > 1)
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return name.match(/[A-Z]/g)?.join("").slice(0, 3) ?? name.slice(0, 2).toUpperCase();
};

/** The bank's logo, or its initials when there is none or it fails to load. */
export function BankLogo({ bank, className }: { bank: Pick<NigerianBank, "name" | "logo">; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-foreground/5",
        className
      )}
    >
      {bank.logo && !failed ? (
        // Plain img: the logos come from a third-party CDN and are tiny; next/image would need a remote pattern.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bank.logo}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full bg-white object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(bank.name)
      )}
    </span>
  );
}

const matches = (bank: NigerianBank, term: string) =>
  bank.name.toLowerCase().includes(term) ||
  bank.code.startsWith(term) ||
  bank.aliases.some((alias) => alias.toLowerCase().includes(term));

export const findBank = (query: { code?: string; name?: string }) =>
  NIGERIAN_BANKS.find((bank) => (query.code ? bank.code === query.code : false)) ??
  NIGERIAN_BANKS.find(
    (bank) =>
      !!query.name &&
      (bank.name === query.name || bank.aliases.some((alias) => alias.toLowerCase() === query.name?.toLowerCase()))
  );

export function BankSelectField({
  id,
  value,
  onChange,
  label = "Bank",
  error,
  helpText,
  className,
}: {
  id: string;
  value: NigerianBank | null;
  onChange: (bank: NigerianBank | null) => void;
  label?: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  className?: string;
}) {
  return (
    <ResourceField
      id={id}
      label={label}
      error={error}
      helpText={helpText}
      className={className}
      value={value}
      onChange={onChange}
      items={BANKS}
      getItemKey={(bank) => bank.slug}
      getItemTitle={(bank) => bank.name}
      getItemGroup={(bank) => bank.group}
      searchFilter={matches}
      placeholder="Choose your bank"
      searchPlaceholder={`Search ${BANKS.length} banks by name or code`}
      emptyMessage="No bank matches that search."
      triggerClassName="h-12"
      renderSummary={(bank) => (
        <>
          <BankLogo bank={bank} className="size-7" />
          <span className="truncate font-semibold text-foreground">{bank.name}</span>
        </>
      )}
      renderSearchItem={(bank, isSelected) => (
        <ResourceFieldItem selected={isSelected}>
          <BankLogo bank={bank} />
          <span className="min-w-0 flex-1 truncate">{bank.name}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">{bank.code}</span>
        </ResourceFieldItem>
      )}
    />
  );
}
