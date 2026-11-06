"use client";
import { AIComposer } from "@/components/ai/ai-composer";
import { AIMessages } from "@/components/ai/ai-messages";
import { useStickToBottom } from "@/components/ai/use-stick-to-bottom";
import { Highlighter } from "@/components/ui/highlighter";
import { ArrowDown01Icon, ArrowRight01Icon, Clock01Icon, PinIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ThinkingOrb } from "thinking-orbs";

import { useChat } from "./_chat-store";
import { ConversationActions } from "./_conversation-actions";

export function Client$AskAIPage() {
  const chat = useChat();
  const active = chat.active;
  const { scrollRef, contentRef, atBottom, follow, onScroll, scrollToLatest } = useStickToBottom(active?.id);
  const recent = chat.conversations
    .toSorted((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);
  const send = (text: string) => {
    follow();
    chat.send(text);
  };

  return (
    <>
      <h1 className="sr-only">CityCore AI</h1>
      <section
        aria-label="Ask AI workspace"
        className={cn(
          "grid h-[calc(100svh-11.5rem)] min-h-120 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8",
          active && "lg:grid-cols-[15rem_minmax(0,1fr)]"
        )}
      >
        {active && (
          <aside className="hidden min-h-0 flex-col border-r border-border p-3 lg:flex">
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Recent</p>
            <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              {recent.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg transition-colors",
                    conversation.id === active.id ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  <button
                    type="button"
                    aria-current={conversation.id === active.id ? "true" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => chat.openChat(conversation.id)}
                  >
                    {conversation.pinned && (
                      <HugeiconsIcon icon={PinIcon} aria-label="Pinned" className="size-3 shrink-0" />
                    )}
                    <span className="truncate">{conversation.title}</span>
                  </button>
                  <ConversationActions conversation={conversation} />
                </div>
              ))}
            </div>
            <Link
              href="/ask-ai/history"
              className="mt-2 flex items-center justify-between rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all history
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
            </Link>
          </aside>
        )}

        <div className="flex min-h-0 min-w-0 flex-col">
          {active && (
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
              <h2 className="truncate text-sm font-semibold">{active.title}</h2>
              <ConversationActions conversation={active} />
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8"
            aria-live="polite"
            aria-relevant="additions"
          >
            <div ref={contentRef} className={cn(!active && "flex min-h-full")}>
              {active ? (
                <div className="mx-auto max-w-3xl">
                  <AIMessages conversation={active} />
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-6 text-center">
                  <div className="relative mb-10 flex size-32 items-center justify-center">
                    <div aria-hidden className="absolute size-56 rounded-full bg-accent/25 blur-3xl" />
                    <ThinkingOrb state="composing" size={64} theme="auto" style={{ transform: "scale(1.9)" }} />
                  </div>
                  <h2 className="relative text-3xl font-light md:text-5xl md:leading-tight">
                    What&apos;s your next <Highlighter>investment question?</Highlighter>
                  </h2>
                  <p className="relative mt-5 max-w-md text-sm/6 text-muted-foreground">
                    Understand your holdings, compare opportunities, or explore what&apos;s moving in the market.
                  </p>
                  {recent.length > 0 && (
                    <button
                      type="button"
                      className="relative mt-6 flex max-w-full items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => chat.openChat(recent[0].id)}
                    >
                      <HugeiconsIcon icon={Clock01Icon} aria-hidden className="size-3.5 shrink-0" />
                      <span className="truncate">Continue: {recent[0].title}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0 px-4 pt-2 pb-4 md:px-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-t from-card to-transparent"
            />
            <AnimatePresence>
              {active && !atBottom && (
                <motion.button
                  type="button"
                  aria-label="Scroll to the latest response"
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  onClick={scrollToLatest}
                  className="absolute -top-10 left-1/2 z-10 -ml-4.5 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className="size-4.5" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="relative mx-auto max-w-3xl">
              <AIComposer key={active?.id ?? "new"} onSend={send} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
