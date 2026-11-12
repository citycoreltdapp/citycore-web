"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
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
import { signOut } from "@/lib/api-client";
import { type NavGroup, dashboardNavGroups } from "@/lib/dashboard-nav";
import { ArrowDown01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  const matches = (url?: string) => !!url && (url === "/" ? pathname === "/" : pathname.startsWith(url));
  // The longest matching url wins, so /users/management lights up Investors rather than Users & Admins too.
  const activeUrl = groups
    .flatMap((group) => group.items.map((item) => item.url))
    .filter(matches)
    .sort((a, b) => b!.length - a!.length)[0];
  const isActive = (url?: string) => !!url && url === activeUrl;
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
              render={
                item.url ? (
                  <Link href={hrefFor(item.url)} onClick={() => isMobile && setOpenMobile(false)} />
                ) : undefined
              }
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

/**
 * The nav scrolls with a hidden scrollbar, so items tucked under the footer give no clue they're there. This fades the
 * edge and shows a pill counting what's below until the list is scrolled to the end.
 */
function SidebarScrollArea({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hiddenBelow, setHiddenBelow] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const area = ref.current;
    if (!area) return;
    const measure = () => {
      const bottom = area.getBoundingClientRect().bottom;
      const items = area.querySelectorAll<HTMLElement>('[data-sidebar="menu-item"]');
      // An item counts as hidden once more than half of it sits below the edge.
      setHiddenBelow(
        [...items].filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.top + rect.height / 2 > bottom;
        }).length
      );
      setIsScrolled(area.scrollTop > 4);
    };
    measure();
    area.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    // The nav renders inside Suspense, so watch for its items arriving too.
    const mutations = new MutationObserver(measure);
    mutations.observe(area, { childList: true, subtree: true });
    return () => {
      area.removeEventListener("scroll", measure);
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  const scrollDown = () => {
    const area = ref.current;
    if (!area) return;
    const top = area.clientHeight * 0.8;
    const start = area.scrollTop;
    area.scrollBy({ top, behavior: "smooth" });
    // Smooth scrolling stalls in tabs that aren't painting; jump instead so the click always does something.
    setTimeout(() => area.scrollTop === start && area.scrollBy({ top }), 350);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <SidebarContent ref={ref} className="gap-4 pt-2">
        {children}
      </SidebarContent>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-sidebar to-transparent transition-opacity duration-300 group-data-[collapsible=icon]:hidden",
          isScrolled ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-sidebar via-sidebar/80 to-transparent transition-opacity duration-300 group-data-[collapsible=icon]:hidden",
          hiddenBelow ? "opacity-100" : "opacity-0"
        )}
      />
      <button
        type="button"
        onClick={scrollDown}
        tabIndex={hiddenBelow ? 0 : -1}
        aria-hidden={!hiddenBelow}
        aria-label={`Show ${hiddenBelow} more menu item${hiddenBelow === 1 ? "" : "s"}`}
        className={cn(
          "absolute bottom-2 left-1/2 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full bg-sidebar/90 py-0 pr-2 pl-3 text-[11px] font-semibold text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border backdrop-blur-md transition-all duration-300 outline-none group-data-[collapsible=icon]:hidden hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          hiddenBelow ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <span className="tabular-nums">{hiddenBelow} more</span>
        <span className="flex size-4 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden
            className="size-3 motion-safe:animate-[nudge_1.6s_ease-in-out_infinite]"
          />
        </span>
      </button>
    </div>
  );
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
  logOutButton,
}: DashboardSidebarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useSavedSidebarState();
  const logout = logOutButton ?? (
    <button
      type="button"
      onClick={() =>
        AppModal.confirm({
          title: "Log out?",
          description: "You'll need to sign in again to get back in.",
          confirmLabel: "Log out",
          onConfirm: () => signOut().then(() => router.push("/dashboard/signin")),
        })
      }
    />
  );

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

        <SidebarScrollArea>
          <React.Suspense
            fallback={<div aria-label="Loading navigation" className="mx-4 h-80 animate-pulse rounded-xl bg-muted" />}
          >
            <DashboardNav groups={groups} basePath={basePath} />
          </React.Suspense>
        </SidebarScrollArea>

        {footer && <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">{footer}</SidebarFooter>}

        {/* Figma only shows this on the collapsed rail. Expanded, it's in the avatar menu. */}
        <SidebarFooter className="hidden pb-6 group-data-[collapsible=icon]:flex">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Log out" className={NAV_BUTTON_STYLES} render={logout}>
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
