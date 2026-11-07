"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardSidebarInset } from "@/components/dashboard/dashboard-sidebar-inset";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { adminNavGroups } from "@/lib/admin-nav";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { ADMIN_NOTIFICATIONS } from "./_data";

// ponytail: there's no admin sign-in yet. Sign out through the API here once there is.
const logOut = () => toast.info("Admin sign-in isn't connected to a backend yet.");

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
      <Button className="h-9 w-full rounded-full" onClick={() => toast.info("Media & Publicity isn't built yet.")}>
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
                <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
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
