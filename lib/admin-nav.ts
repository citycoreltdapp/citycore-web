import {
  Analytics01Icon,
  ArrowDataTransferHorizontalIcon,
  AuditIcon,
  Briefcase01Icon,
  Coins01Icon,
  CustomerSupportIcon,
  Home01Icon,
  Image01Icon,
  Mail01Icon,
  Megaphone01Icon,
  News01Icon,
  SecurityCheckIcon,
  Settings02Icon,
  UserAccountIcon,
  UserMultipleIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import type { NavGroup } from "./dashboard-nav";

// Routes are relative to the admin tenant; omit URLs for pages that are not built yet.
export const adminNavGroups: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { title: "Dashboard", url: "/", icon: Home01Icon },
      { title: "Account", url: "/account", icon: UserAccountIcon },
      { title: "Users & Admins", url: "/users", icon: UserMultipleIcon },
      { title: "KYC Compliance", url: "/kyc", icon: SecurityCheckIcon },
      { title: "Investments", url: "/investments", icon: Briefcase01Icon },
      { title: "Returns & Maturity", url: "/returns", icon: Coins01Icon },
      { title: "Withdrawals", url: "/withdrawals", icon: ArrowDataTransferHorizontalIcon },
      { title: "Reports", url: "/reports", icon: Analytics01Icon },
      { title: "Settings", url: "/settings", icon: Settings02Icon },
      { title: "Helpdesk & Audit", url: "/content", icon: AuditIcon },
      { title: "Support", url: "/support", icon: CustomerSupportIcon },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Growth & Broadcasts", url: "/growth", icon: Megaphone01Icon },
      { title: "Emails", url: "/emails", icon: Mail01Icon },
      { title: "Blog", url: "/blog", icon: News01Icon },
      { title: "Media library", url: "/media", icon: Image01Icon },
      { title: "Platform Configuration", url: "/platform", icon: Wrench01Icon },
    ],
  },
];
