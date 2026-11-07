import { FloatingAIChat } from "@/components/ai/floating-ai-chat";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardSidebarInset } from "@/components/dashboard/dashboard-sidebar-inset";
import { VerificationBanner } from "@/components/dashboard/verification-banner";

import { ChatProvider } from "./ask-ai/_chat-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <DashboardSidebar>
        <DashboardSidebarInset banner={<VerificationBanner />}>{children}</DashboardSidebarInset>
        <FloatingAIChat />
      </DashboardSidebar>
    </ChatProvider>
  );
}
