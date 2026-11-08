"use client";
import { useEffect, useRef, useState } from "react";

import { useChat } from "@/app/dashboard/(dashboard)/ask-ai/_chat-store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useIsDark } from "@/hooks/use-is-dark";
import { Add01Icon, ArrowExpand01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MetalFx } from "metal-fx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThinkingOrb } from "thinking-orbs";

import { AIComposer } from "./ai-composer";
import { AIMessages } from "./ai-messages";
import { useStickToBottom } from "./use-stick-to-bottom";

const LAUNCHER_SIZE = 72;
const EDGE_GAP = 12;
const SUGGESTIONS = ["Summarise my portfolio", "Explain the Lagos market outlook", "How do I secure my account?"];

const clampToViewport = (x: number, y: number) => ({
  x: Math.max(EDGE_GAP, Math.min(x, window.innerWidth - LAUNCHER_SIZE - EDGE_GAP)),
  y: Math.max(EDGE_GAP, Math.min(y, window.innerHeight - LAUNCHER_SIZE - EDGE_GAP)),
});

/** Its own component so the scroll hook runs once the popover has actually mounted its content. */
function FloatingPanel({ onClose }: { onClose: () => void }) {
  const chat = useChat();
  const { scrollRef, contentRef, follow, onScroll } = useStickToBottom(chat.active?.id);
  const send = (text: string) => {
    follow();
    chat.send(text);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <ThinkingOrb state={chat.replying ? "working" : "breathing"} size={20} theme="auto" />
        <div className="min-w-0 flex-1">
          <PopoverTitle>CityCore AI</PopoverTitle>
          <PopoverDescription className="text-xs">
            {chat.replying ? "Responding…" : "Workspace preview"}
          </PopoverDescription>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="New floating conversation" onClick={() => chat.newChat()}>
          <HugeiconsIcon icon={Add01Icon} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Continue in full chat"
          render={<Link href="/dashboard/ask-ai" onClick={onClose} />}
          nativeButton={false}
        >
          <HugeiconsIcon icon={ArrowExpand01Icon} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close floating chat" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto p-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div ref={contentRef} className="flex min-h-full flex-col">
          {chat.active ? (
            <AIMessages conversation={chat.active} compact />
          ) : (
            <div className="my-auto flex flex-col items-start gap-3 py-4">
              <ThinkingOrb state="composing" size={64} theme="auto" />
              <h2 className="text-2xl font-light">A little more clarity.</h2>
              <p className="text-sm/6 text-muted-foreground">
                Ask about your portfolio, the market or your account. You can continue the conversation in full chat at
                any time.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => send(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <AIComposer key={chat.active?.id ?? "floating-new"} compact prompts={[]} onSend={send} />
      </div>
    </>
  );
}

export function FloatingAIChat() {
  const chat = useChat();
  const pathname = usePathname();
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    const clamp = () => setPosition((current) => (current ? clampToViewport(current.x, current.y) : current));
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  if (/(?:^|\/)ask-ai(?:\/|$)/.test(pathname)) return null;

  return (
    <div className="fixed z-40" style={position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 }}>
      <Popover open={open} onOpenChange={setOpen}>
        {/* MetalFx hides its child until WebGL draws. Forcing it visible keeps the chat reachable if WebGL never does. */}
        <MetalFx
          variant="circle"
          preset="gold"
          strength={0.9}
          theme={isDark ? "dark" : "light"}
          className="visible! opacity-100!"
        >
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                aria-label={open ? "Close CityCore AI" : "Open CityCore AI"}
                className="relative size-18 touch-none rounded-full p-0 shadow-lg hover:bg-transparent dark:hover:bg-transparent"
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
                  moved.current = false;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const start = drag.current;
                  if (!start) return;
                  const dx = event.clientX - start.x;
                  const dy = event.clientY - start.y;
                  if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true;
                  if (moved.current) setPosition(clampToViewport(start.left + dx, start.top + dy));
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onClick={(event) => {
                  if (moved.current && event.detail > 0) event.preventDefault();
                }}
              />
            }
          >
            {/* MetalFx strips the button's own shadow and border, so the edge lives on this surface. */}
            <span aria-hidden className="absolute inset-0.5 rounded-full bg-card shadow-lg ring-1 ring-foreground/10" />
            <ThinkingOrb state={chat.replying ? "working" : "composing"} size={64} theme="auto" className="relative" />
          </PopoverTrigger>
        </MetalFx>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={14}
          className="flex h-[min(620px,calc(100svh-7rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-xl"
        >
          <FloatingPanel onClose={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
