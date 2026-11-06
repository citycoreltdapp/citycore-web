import * as React from "react";

import { type MixinProps, splitProps } from "@/lib/mixin";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

export interface StepperStep {
  title: string;
  description?: string;
}

interface StepperProps
  extends
    Omit<React.ComponentProps<"ol">, "children">,
    MixinProps<"item", Pick<React.ComponentProps<"li">, "className">> {
  steps: readonly StepperStep[];
  /** Zero-based. Steps before it show as done, steps after it as upcoming. */
  currentStep: number;
}

const ARROW = "[clip-path:polygon(0_0,calc(100%-1rem)_0,100%_50%,calc(100%-1rem)_100%,0_100%)]";

/** Progress through a multi-step flow, drawn as a row of arrows. */
export function Stepper({ steps, currentStep, className, ...mixProps }: StepperProps) {
  const { item: itemProps, rest } = splitProps(mixProps, "item");

  return (
    <ol {...rest} className={cn("flex overflow-hidden rounded-lg border bg-card", className)}>
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.title}
            aria-current={isCurrent ? "step" : undefined}
            style={{ zIndex: steps.length - index }}
            className={cn(
              "relative flex min-w-0 flex-1 items-center gap-2 py-3 pr-5 pl-6 first:pl-3 last:pr-2",
              !isLast && "-mr-4",
              (isDone || isCurrent) && !isLast && ARROW,
              isDone && "bg-muted",
              isCurrent && "bg-primary text-primary-foreground",
              itemProps.className
            )}
          >
            <span
              aria-hidden
              className={cn(
                "hidden size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium sm:flex",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary-foreground",
                !isDone && !isCurrent && "border-border text-muted-foreground"
              )}
            >
              {isDone ? <HugeiconsIcon icon={Tick02Icon} className="size-4" /> : String(index + 1).padStart(2, "0")}
            </span>

            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "truncate text-xs font-medium sm:text-sm",
                  !isDone && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {step.description && (
                <span
                  className={cn(
                    "hidden truncate text-xs sm:block",
                    isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
