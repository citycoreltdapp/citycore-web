"use client";

import * as React from "react";

import { useChat } from "@/app/dashboard/(dashboard)/ask-ai/_chat-store";
import { Button } from "@/components/ui/button";
import { useIsDark } from "@/hooks/use-is-dark";
import { ArrowUp01Icon, Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BorderBeam } from "border-beam";
import { cn } from "cn";
import { toast } from "sonner";

export const AI_QUICK_PROMPTS = [
  "Summarise my portfolio",
  "Compare Golden Estate and Silver City",
  "Explain the Lagos market outlook",
  "What can I do with my wallet?",
  "Review my account security",
];

const CHIP_FADE = "linear-gradient(to right, transparent, black 16px, black calc(100% - 32px), transparent)";

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function AIComposer({
  onSend,
  compact = false,
  prompts = AI_QUICK_PROMPTS,
}: {
  onSend: (text: string) => void;
  compact?: boolean;
  prompts?: string[];
}) {
  const { replying } = useChat();
  const isDark = useIsDark();
  const busy = !!replying;
  const [value, setValue] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const recognitionRef = React.useRef<Recognition | null>(null);

  React.useEffect(() => () => recognitionRef.current?.stop(), []);

  const send = () => {
    const text = value.trim();
    if (!text || busy) return;
    recognitionRef.current?.stop();
    onSend(text);
    setValue("");
    inputRef.current?.focus();
  };

  const toggleDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const { SpeechRecognition, webkitSpeechRecognition } = window as RecognitionWindow;
    const Dictation = SpeechRecognition ?? webkitSpeechRecognition;
    if (!Dictation) {
      toast.info("Voice input isn't supported in this browser.");
      return;
    }
    const recognition = new Dictation();
    const before = value ? `${value.trimEnd()} ` : "";
    recognition.lang = "en-NG";
    recognition.interimResults = true;
    recognition.onresult = ({ results }) =>
      setValue(
        before +
          Array.from(results)
            .map((result) => result[0].transcript)
            .join("")
      );
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      inputRef.current?.focus();
    };
    recognition.onerror = recognition.onend;
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      {prompts.length > 0 && (
        <div
          className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-1 pb-0.5"
          style={{ maskImage: CHIP_FADE, WebkitMaskImage: CHIP_FADE }}
        >
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={busy}
              onClick={() => onSend(prompt)}
              className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs whitespace-nowrap text-muted-foreground transition-colors outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <BorderBeam
        active={listening || busy}
        colorVariant="sunset"
        theme={isDark ? "dark" : "light"}
        size="md"
        strength={0.85}
        saturation={0.9}
        hueRange={12}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex items-end gap-1.5 rounded-2xl border border-border bg-card p-2 shadow-sm transition-colors focus-within:border-foreground/25"
        >
          <textarea
            ref={inputRef}
            aria-label="Ask CityCore a question"
            rows={1}
            maxLength={2000}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={
              listening
                ? "Listening…"
                : busy
                  ? "CityCore AI is responding…"
                  : compact
                    ? "Ask CityCore…"
                    : "Ask about your portfolio, the market or your account…"
            }
            className="field-sizing-content max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm/5 outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            className={cn(
              "size-9 shrink-0 rounded-xl",
              listening ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
            onClick={toggleDictation}
          >
            {listening ? (
              <span aria-hidden className="flex h-4 items-center gap-0.5">
                {[0, 1, 2].map((bar) => (
                  <span
                    key={bar}
                    className="h-full w-0.5 rounded-full bg-current"
                    style={{ animation: `eq-bounce 900ms ease-in-out ${bar * 150}ms infinite` }}
                  />
                ))}
              </span>
            ) : (
              <HugeiconsIcon icon={Mic01Icon} aria-hidden />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!value.trim() || busy}
            className="size-9 shrink-0 rounded-xl"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} aria-hidden />
          </Button>
        </form>
      </BorderBeam>

      <p className="flex flex-wrap justify-between gap-x-3 px-1 text-[11px] text-muted-foreground">
        <span>Sample data · Prepared responses · Live AI not connected</span>
        {!compact && <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span>}
      </p>
    </div>
  );
}
