import { FloatingAIChat } from "@/components/ai/floating-ai-chat";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardSidebarInset } from "@/components/dashboard/dashboard-sidebar-inset";

import { ChatProvider } from "./ask-ai/_chat-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <DashboardSidebar>
        <DashboardSidebarInset>{children}</DashboardSidebarInset>
        <FloatingAIChat />
      </DashboardSidebar>
    </ChatProvider>
  );
}
