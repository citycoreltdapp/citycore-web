import type { ReactNode } from "react";

import { ChatNavigation } from "./_chat-navigation";

export default function AskAILayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChatNavigation />
      {children}
    </>
  );
}
