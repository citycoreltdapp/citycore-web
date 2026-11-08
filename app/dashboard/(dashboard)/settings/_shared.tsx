"use client";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/dashboard/settings", label: "Profile" },
  { href: "/dashboard/settings/security", label: "Security" },
];

export function SettingsNavigation() {
  const pathname = usePathname();
  const isSecurity = pathname.endsWith("/security");

  return (
    <nav aria-label="Settings sections" className="flex w-fit gap-1 rounded-full bg-muted p-1">
      {SECTIONS.map(({ href, label }) => {
        const isCurrent = (href === "/settings/security") === isSecurity;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrent ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsPanel({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="text-xs/5 text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function FormActions({ onCancel, disabled = false }: { onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
      <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" className="h-10 rounded-full px-5" disabled={disabled}>
        Save changes
      </Button>
    </div>
  );
}
