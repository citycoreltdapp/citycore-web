"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { SentIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";

/** Safari can't apply an SVG filter to a moving element, so the morph goes without it there. */
const supportsGooeyFilter = () => {
  const agent = navigator.userAgent.toLowerCase();
  const isSafari = agent.includes("safari") && !/chrome|chromium|android|firefox/.test(agent);
  return !isSafari && !agent.includes("crios");
};

interface GooeyFeedbackProps {
  onSubmit: (reason: string) => void;
  placeholder?: string;
  isActive?: boolean;
  className?: string;
}

/** A thumbs-down button that morphs into a one-line "what was wrong?" input. */
export function GooeyFeedback({
  onSubmit,
  placeholder = "What was wrong?",
  isActive = false,
  className,
}: GooeyFeedbackProps) {
  const filterId = `gooey-${React.useId().replace(/:/g, "_")}`;
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [open]);

  const submit = () => {
    const reason = text.trim();
    if (!reason) return;
    onSubmit(reason);
    setText("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative inline-flex items-center gap-1.5", className)}>
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -12"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* The filter erases thin pixels, so it only applies once the pill has a solid fill. */}
      <div style={{ filter: open && supportsGooeyFilter() ? `url(#${filterId})` : undefined }}>
        <motion.div
          initial={false}
          animate={{ width: open ? 196 : 28 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          className={cn("flex h-7 max-w-full items-center overflow-hidden rounded-full", open && "bg-muted")}
        >
          {open ? (
            <input
              ref={inputRef}
              value={text}
              maxLength={200}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
              aria-label="Feedback reason"
              className="h-7 w-full min-w-0 bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Report a problem with this response"
              aria-pressed={isActive}
              className={cn("size-7 rounded-full", isActive ? "text-foreground" : "text-muted-foreground")}
              onClick={() => setOpen(true)}
            >
              <HugeiconsIcon icon={ThumbsDownIcon} />
            </Button>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Button
              type="button"
              size="icon"
              aria-label="Submit feedback"
              disabled={!text.trim()}
              className="size-7 rounded-full"
              onClick={submit}
            >
              <HugeiconsIcon icon={SentIcon} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
