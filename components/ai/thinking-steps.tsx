"use client";

import * as React from "react";

import { ArrowDown01Icon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

const EASE = "cubic-bezier(0.23,1,0.32,1)";

/** What the assistant is doing: open with shimmering text while it works, then folded away and reopenable. */
export function ThinkingSteps({
  working,
  steps,
  visibleSteps,
  doneLabel = "Reviewed sample data",
}: {
  working: boolean;
  steps: string[];
  visibleSteps: number;
  doneLabel?: string;
}) {
  const [userExpanded, setUserExpanded] = React.useState<boolean | null>(null);
  const expanded = working || (userExpanded ?? false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={expanded}
        disabled={working}
        onClick={() => setUserExpanded(!expanded)}
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring enabled:hover:bg-muted"
      >
        <HugeiconsIcon
          icon={SparklesIcon}
          aria-hidden
          className={cn("size-3.5", working ? "text-foreground" : "text-muted-foreground")}
        />
        <span role="status" className="contents">
          {working ? (
            <span
              className="bg-clip-text text-xs font-medium whitespace-nowrap text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)",
                backgroundSize: "200% 100%",
                animation: "shimmer-text 1.4s linear infinite",
              }}
            >
              Thinking
            </span>
          ) : (
            <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{doneLabel}</span>
          )}
        </span>
        {!working && (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden
            className={cn("size-3.5 text-muted-foreground transition-transform duration-300", expanded && "rotate-180")}
          />
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: EASE,
        }}
      >
        <div className="overflow-hidden">
          <ol className="mt-1 ml-1.5 flex flex-col gap-1 border-l border-border py-1 pl-3.5">
            {steps.slice(0, visibleSteps).map((step, index) => {
              const isCurrent = working && index === visibleSteps - 1;
              return (
                <li
                  key={step}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                  style={working ? { animation: `fade-up 320ms ${EASE} both` } : undefined}
                >
                  {isCurrent ? (
                    <span
                      aria-hidden
                      className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-border border-t-foreground"
                    />
                  ) : (
                    <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">{step}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
