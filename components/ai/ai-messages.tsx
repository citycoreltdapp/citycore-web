"use client";

import * as React from "react";

import {
  type Conversation,
  REPLY_STEPS,
  REPLY_THINKING_MS,
  REPLY_WORD_MS,
} from "@/app/dashboard/(dashboard)/ask-ai/_chat-data";
import { useChat } from "@/app/dashboard/(dashboard)/ask-ai/_chat-store";
import { Button } from "@/components/ui/button";
import { GooeyFeedback } from "@/components/ui/gooey-feedback";
import { ArrowRight01Icon, Copy01Icon, CopyCheckIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";

import { ThinkingSteps } from "./thinking-steps";

type Message = Conversation["messages"][number];

const FADE_UP = "fade-up 360ms cubic-bezier(0.23,1,0.32,1) both";

/** Milliseconds since `startedAt`, ticking while there is a start time. */
function useElapsed(startedAt: number | undefined) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (startedAt === undefined) return;
    const tick = () => setElapsed(Date.now() - startedAt);
    const interval = setInterval(tick, 40);
    return () => clearInterval(interval);
  }, [startedAt]);
  return elapsed;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : "Copy response"}
      className="size-7 rounded-full text-muted-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Clipboard access is unavailable.");
        }
      }}
    >
      <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} />
    </Button>
  );
}

function AssistantReply({
  conversationId,
  message,
  isLatest,
  compact,
}: {
  conversationId: string;
  message: Message;
  isLatest: boolean;
  compact: boolean;
}) {
  const chat = useChat();
  const replying = chat.replying?.id === message.id ? chat.replying : null;
  const elapsed = useElapsed(replying?.startedAt);
  const answer = message.answer;
  if (!answer) return null;

  const steps = REPLY_STEPS[answer.topic];
  const isThinking = !!replying && elapsed < REPLY_THINKING_MS;
  const words = message.text.split(" ");
  const shownWords = replying ? Math.floor((elapsed - REPLY_THINKING_MS) / REPLY_WORD_MS) : words.length;
  const isTyping = !!replying && !isThinking && shownWords < words.length;
  const isSettled = !isThinking && !isTyping;
  const reveal = (index = 0) => (replying ? { animation: FADE_UP, animationDelay: `${index * 70}ms` } : undefined);

  return (
    <article className={cn("flex items-start gap-3", compact && "gap-2")}>
      <ThinkingOrb
        state={isThinking ? "working" : isTyping ? "composing" : "breathing"}
        size={20}
        theme="auto"
        paused={!isLatest}
        className="mt-0.5 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <ThinkingSteps
          working={isThinking}
          steps={steps}
          visibleSteps={
            isThinking ? Math.max(Math.ceil(elapsed / (REPLY_THINKING_MS / steps.length)), 1) : steps.length
          }
        />

        {!isThinking && (
          <>
            <h3 className={cn("text-xl font-light", compact && "text-base font-semibold")} style={reveal()}>
              {answer.title}
            </h3>
            <p className="text-sm/6 wrap-break-word">
              {/* The full sentence for screen readers, so a live region doesn't read it out word by word. */}
              <span className="sr-only">{message.text}</span>
              <span aria-hidden>
                {words.slice(0, Math.max(shownWords, 0)).join(" ")}
                {isTyping && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent" />
                )}
              </span>
            </p>
          </>
        )}

        {isSettled && (
          <>
            <ul className="flex flex-col gap-2">
              {answer.points.map((point, index) => (
                <li key={point} className="flex gap-2.5 text-sm/6 text-muted-foreground" style={reveal(index)}>
                  <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>

            {!compact && (
              <div className="flex flex-wrap gap-2" style={reveal(answer.points.length)}>
                {answer.links.map((link) => (
                  <Button
                    key={link.href}
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    render={<Link href={link.href} />}
                    nativeButton={false}
                  >
                    {link.label}
                    <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
                  </Button>
                ))}
              </div>
            )}

            <div style={reveal(answer.points.length + 1)}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="min-w-0 text-xs text-muted-foreground">{answer.source}</p>
                <div className="flex items-center gap-0.5">
                  <CopyButton text={[answer.title, message.text, ...answer.points].join("\n\n")} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Helpful response"
                    aria-pressed={message.feedback === "helpful"}
                    className={cn(
                      "size-7 rounded-full",
                      message.feedback === "helpful" ? "text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => chat.feedback(conversationId, message.id, "helpful")}
                  >
                    <HugeiconsIcon icon={ThumbsUpIcon} />
                  </Button>
                  <GooeyFeedback
                    isActive={message.feedback === "unhelpful"}
                    onSubmit={(reason) => chat.feedback(conversationId, message.id, "unhelpful", reason)}
                  />
                </div>
              </div>
              {message.feedbackReason && (
                <p className="pt-1 text-right text-xs text-muted-foreground">
                  Saved on this device: &ldquo;{message.feedbackReason}&rdquo;
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function AIMessages({ conversation, compact = false }: { conversation: Conversation; compact?: boolean }) {
  const { replying } = useChat();
  const lastId = conversation.messages.at(-1)?.id;

  return (
    <div className={cn("flex flex-col gap-8", compact && "gap-6")}>
      {conversation.messages.map((message) =>
        message.role === "user" ? (
          <div
            key={message.id}
            className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm/6 wrap-break-word whitespace-pre-wrap text-primary-foreground"
            style={replying && message.id === conversation.messages.at(-2)?.id ? { animation: FADE_UP } : undefined}
          >
            {message.text}
          </div>
        ) : (
          <AssistantReply
            key={message.id}
            conversationId={conversation.id}
            message={message}
            isLatest={message.id === lastId}
            compact={compact}
          />
        )
      )}
    </div>
  );
}
