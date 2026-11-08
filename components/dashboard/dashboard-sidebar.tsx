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
import { type NavGroup, dashboardNavGroups } from "@/lib/dashboard-nav";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

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

function DashboardNav({ groups, basePath }: { groups: NavGroup[]; basePath: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const rawPathname = usePathname();
  const pathname = (rawPathname.startsWith(basePath) ? rawPathname.slice(basePath.length) : rawPathname) || "/";

  const isActive = (url?: string) => !!url && (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const hrefFor = (url: string) => (url === "/" ? basePath : `${basePath}${url}`);

  return groups.map((group) => (
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
              // ponytail: a nav item with no url is a page that isn't built yet, so it says so instead of a 404.
              onClick={item.url ? undefined : () => toast.info(`${item.title} isn't built yet.`)}
              render={item.url ? <Link href={hrefFor(item.url)} onClick={() => isMobile && setOpenMobile(false)} /> : undefined}
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

interface DashboardSidebarProps {
  children: React.ReactNode;
  groups?: NavGroup[];
  /** The app/ folder this tenant is served from. */
  basePath?: string;
  brand?: string;
  /** Sits above the log out button, on the expanded sidebar only, and hides on short screens to leave room for the nav. */
  footer?: React.ReactNode;
  logOutButton?: React.ReactElement;
}

export function DashboardSidebar({
  children,
  groups = dashboardNavGroups,
  basePath = "/dashboard",
  brand = "City Core",
  footer,
  logOutButton = <Link href="/dashboard/signin" />,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useSavedSidebarState();

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen} style={SIDEBAR_STYLE}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-6 pt-6 pb-0 group-data-[collapsible=icon]:px-0">
          <Link
            href={basePath}
            className="flex items-center gap-2.5 border-b border-dashed pb-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none"
          >
            <Image src="/assets/images/logo.png" alt="" width={34} height={40} className="size-8 object-contain" />
            <span className="text-2xl font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
              {brand}
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-4 pt-2">
          <React.Suspense
            fallback={<div aria-label="Loading navigation" className="mx-4 h-80 animate-pulse rounded-xl bg-muted" />}
          >
            <DashboardNav groups={groups} basePath={basePath} />
          </React.Suspense>
        </SidebarContent>

        {footer && <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">{footer}</SidebarFooter>}

        {/* Figma only shows this on the collapsed rail. Expanded, it's in the avatar menu. */}
        <SidebarFooter className="hidden pb-6 group-data-[collapsible=icon]:flex">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Log out" className={NAV_BUTTON_STYLES} render={logOutButton}>
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
