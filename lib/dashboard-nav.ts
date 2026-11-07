import {
  AiChat02Icon,
  ArrowDataTransferHorizontalIcon,
  ChartLineData01Icon,
  CustomerSupportIcon,
  Home01Icon,
  Invoice01Icon,
  Settings02Icon,
  ShoppingCart01Icon,
  Store01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface DashboardNavItem {
  title: string;
  /** Leave out while the page isn't built yet. */
  url?: string;
  icon: IconSvgElement;
}

export interface NavGroup {
  label: string;
  items: DashboardNavItem[];
}

export const dashboardNavGroups: NavGroup[] = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", url: "/", icon: Home01Icon },
      { title: "Wallet", url: "/wallet", icon: Wallet01Icon },
      { title: "Withdrawals", url: "/withdrawals", icon: ArrowDataTransferHorizontalIcon },
      { title: "Transactions", url: "/transactions", icon: Invoice01Icon },
      { title: "Marketplace", url: "/marketplace", icon: Store01Icon },
      { title: "My Investments", url: "/investments", icon: ShoppingCart01Icon },
      { title: "Market Insights", url: "/market-insights", icon: ChartLineData01Icon },
    ],
  },
  {
    label: "Assist",
    items: [
      { title: "Settings & Security", url: "/settings", icon: Settings02Icon },
      { title: "Help & Support", url: "/support", icon: CustomerSupportIcon },
      { title: "Ask AI", url: "/ask-ai", icon: AiChat02Icon },
    ],
  },
];
