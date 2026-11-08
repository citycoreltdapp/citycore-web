"use client";

import * as React from "react";

import { SearchField } from "@/components/primitives/search-field";
import { ThemeToggle } from "@/components/primitives/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import type { InboxMessage } from "@/constant/notifications";
import { ArrowLeft01Icon, ArrowRight01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { toast } from "sonner";

import { NotificationsPopover } from "./notifications-popover";

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      {/* Switched with CSS, not useIsMobile, so phones don't see the arrow flash before hydration. */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className="ml-4 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-foreground transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
      >
        <HugeiconsIcon icon={Menu01Icon} aria-hidden className="size-5" />
      </button>

      <button
        type="button"
        aria-label={isCollapsed ? "Open sidebar" : "Collapse sidebar"}
        onClick={toggleSidebar}
        className="hidden h-8 w-5 shrink-0 cursor-pointer items-center justify-center rounded-r-md bg-primary text-primary-foreground transition-colors outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 md:flex"
      >
        <HugeiconsIcon icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon} aria-hidden className="size-4" />
      </button>
    </>
  );
}

interface DashboardHeaderProps {
  notifications?: { messages: InboxMessage[]; readIds: string[]; asOf: string };
  /** The items in the avatar menu. */
  accountMenuItems?: React.ReactNode;
}

export function DashboardHeader({ notifications, accountMenuItems }: DashboardHeaderProps) {
  const [search, setSearch] = React.useState("");

  return (
    <header className="flex h-20 shrink-0 items-center gap-3 bg-sidebar pr-4 md:pr-6">
      <SidebarToggle />

      <SearchField
        id="dashboard-search"
        aria-label="Search"
        className="hidden min-w-0 flex-1 md:flex xl:max-w-sm"
        groupClassName="h-10 rounded-full border-none bg-muted dark:bg-muted"
        buttonClassName="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
        value={search}
        onChange={setSearch}
        onSearch={() => toast.info("Search isn't connected to a backend yet.")}
      />

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle variant="ghost" className="size-10 rounded-full bg-muted [&_svg]:size-5" />
        <NotificationsPopover
          messages={notifications?.messages}
          initialReadIds={notifications?.readIds}
          asOf={notifications?.asOf}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="size-10">
              <AvatarImage src="/assets/images/investors/investor-avatar-02.jpg" alt="" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {accountMenuItems ?? (
              <>
                <DropdownMenuItem render={<Link href="/settings" />}>Settings & Security</DropdownMenuItem>
                {/* ponytail: no sessions yet, so this only goes to sign-in. Sign out through the API here. */}
                <DropdownMenuItem variant="destructive" render={<Link href="/signin" />}>
                  Log out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
