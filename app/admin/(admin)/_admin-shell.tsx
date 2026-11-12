"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardSidebarInset } from "@/components/dashboard/dashboard-sidebar-inset";
import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  UserListIcon,
  UserMultipleIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import type { NavGroup } from "@/lib/dashboard-nav";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { ADMIN_NOTIFICATIONS } from "./_data";

export const adminNavGroups: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { title: "Dashboard", url: "/", icon: Home01Icon },
      { title: "Account", url: "/account", icon: UserAccountIcon },
      { title: "Users & Admins", url: "/users", icon: UserMultipleIcon },
      { title: "Investors", url: "/users/management", icon: UserListIcon },
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


// ponytail: there's no admin sign-in yet. Sign out through the API here once there is.
const logOut = () =>
  AppModal.confirm({
    title: "Log out?",
    description: "You'll leave the admin console on this browser.",
    confirmLabel: "Log out",
    onConfirm: () => toast.info("Admin sign-in isn't connected to a backend yet."),
  });

function PublicityCard() {
  return (
    <div className="flex flex-col items-center gap-3 px-2 py-2 text-center">
      <Image
        src="/assets/images/admin/publicity-hd.png"
        alt=""
        width={1586}
        height={992}
        sizes="224px"
        className="pointer-events-none h-auto w-full select-none"
      />
      <p className="text-xs/5 text-muted-foreground">Reach out to your clients in minutes</p>
      <Button className="h-9 w-full rounded-full" nativeButton={false} render={<Link href="/admin/blog" />}>
        Media & Publicity
      </Button>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSidebar
      groups={adminNavGroups}
      basePath="/admin"
      brand="Admin"
      footer={<PublicityCard />}
      logOutButton={<button type="button" onClick={logOut} />}
    >
      <DashboardSidebarInset
        header={
          <DashboardHeader
            notifications={ADMIN_NOTIFICATIONS}
            accountMenuItems={
              <>
                <DropdownMenuItem render={<Link href="/admin/settings" />}>Settings</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={logOut}>
                  Log out
                </DropdownMenuItem>
              </>
            }
          />
        }
      >
        {children}
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}
