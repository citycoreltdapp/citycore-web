"use client";
import { Button } from "@/components/ui/button";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useChat } from "./_chat-store";

const SECTIONS = [
  { href: "/dashboard/ask-ai", label: "Ask AI" },
  { href: "/dashboard/ask-ai/history", label: "History" },
  { href: "/dashboard/ask-ai/explore", label: "Investment Explorer" },
];

export function ChatNavigation() {
  const pathname = usePathname();
  const chat = useChat();
  const isChat = pathname.endsWith("/ask-ai");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="AI workspace" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {SECTIONS.map(({ href, label }) => {
          const isCurrent = pathname.endsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isCurrent ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {isChat && chat.active && (
        <Button className="h-10 rounded-full px-4" onClick={() => chat.newChat()}>
          <HugeiconsIcon icon={Add01Icon} aria-hidden />
          New chat
        </Button>
      )}
    </div>
  );
}
