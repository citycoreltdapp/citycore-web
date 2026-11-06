"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_STYLE = { "--sidebar-width-icon": "4.5rem" } as React.CSSProperties;

const NAV_BUTTON_STYLES =
  "h-10 gap-3 rounded-lg px-3 data-active:bg-primary data-active:text-primary-foreground data-active:hover:bg-primary data-active:hover:text-primary-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0! [&_svg]:size-5";

/** The sidebar's choice is saved in a cookie. It's read here because the page itself is prerendered as expanded. */
function useSavedSidebarState() {
  const [choice, setChoice] = React.useState<boolean | null>(null);
  const savedIsOpen = React.useSyncExternalStore(
    () => () => {},
    () => !document.cookie.includes("sidebar_state=false"),
    () => true
  );

  return [choice ?? savedIsOpen, setChoice] as const;
}

function DashboardNav() {
  const { isMobile, setOpenMobile } = useSidebar();
  // The proxy serves this tenant from /dashboard, and the server sees that path while the browser sees "/".
  const pathname = usePathname().replace(/^\/dashboard/, "") || "/";

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return dashboardNavGroups.map((group) => (
    <SidebarGroup key={group.label} className="px-4 group-data-[collapsible=icon]:px-0">
      <SidebarGroupLabel className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {group.label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
        {group.items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive(item.url)}
              tooltip={item.title}
              className={NAV_BUTTON_STYLES}
              render={<Link href={item.url} onClick={() => isMobile && setOpenMobile(false)} />}
            >
              <HugeiconsIcon icon={item.icon} aria-hidden />
              <span className="group-data-[collapsible=icon]:sr-only">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ));
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useSavedSidebarState();

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen} style={SIDEBAR_STYLE}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-6 pt-6 pb-0 group-data-[collapsible=icon]:px-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 border-b border-dashed pb-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none"
          >
            <Image src="/assets/images/logo.png" alt="" width={34} height={40} className="size-8 object-contain" />
            <span className="text-2xl font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
              City Core
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-4 pt-2">
          <DashboardNav />
        </SidebarContent>

        {/* Figma only shows this on the collapsed rail. Expanded, it's in the avatar menu. */}
        <SidebarFooter className="hidden pb-6 group-data-[collapsible=icon]:flex">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Log out" className={NAV_BUTTON_STYLES} render={<Link href="/signin" />}>
                <HugeiconsIcon icon={Logout01Icon} aria-hidden />
                <span className="group-data-[collapsible=icon]:sr-only">Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {children}
    </SidebarProvider>
  );
}
