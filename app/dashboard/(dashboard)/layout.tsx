import { Suspense } from "react";

import { FloatingAIChat } from "@/components/ai/floating-ai-chat";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardSidebarInset } from "@/components/dashboard/dashboard-sidebar-inset";
import { VerificationBanner } from "@/components/dashboard/verification-banner";

import { SessionWatcher } from "./_session-watcher";
import { SidebarAccount } from "./_sidebar-account";
import { ChatProvider } from "./ask-ai/_chat-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <SessionWatcher />
      <DashboardSidebar footer={<SidebarAccount />}>
        <DashboardSidebarInset banner={<VerificationBanner />}>
          <Suspense fallback={null}>{children}</Suspense>
        </DashboardSidebarInset>
        <Suspense fallback={null}>
          <FloatingAIChat />
        </Suspense>
      </DashboardSidebar>
    </ChatProvider>
  );
}
