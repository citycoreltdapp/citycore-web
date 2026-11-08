"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/settings", label: "Account profile" },
  { href: "/admin/settings/personal", label: "Personal & next of kin" },
  { href: "/admin/settings/security", label: "Security" },
  { href: "/admin/settings/notifications", label: "Notifications" },
  { href: "/admin/settings/limits", label: "Payment limits" },
];
export function AdminSettingsNavigation() {
  const pathname = usePathname().replace(/^\/admin/, "");
  return (
    <nav
      aria-label="Admin settings sections"
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${pathname === item.href ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
