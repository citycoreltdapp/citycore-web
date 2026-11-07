import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";

/** Everything beside the sidebar: the header, an optional banner pinned under it, and the page. */
export function DashboardSidebarInset({
  header = <DashboardHeader />,
  banner,
  children,
}: {
  header?: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SidebarInset className="h-svh min-w-0 overflow-hidden">
      {header}
      {banner}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 md:p-5">{children}</div>
      </div>
    </SidebarInset>
  );
}
