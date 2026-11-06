import * as React from "react";

import { Sparkline } from "@/components/primitives/sparkline";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

export interface StatTrend {
  /** Such as "50.8%". */
  value: string;
  direction: "up" | "down";
  /** Whether the change is good or bad. An increase can be bad, so this is separate from direction. */
  tone?: "positive" | "negative";
}

/** A panel of stats split by dashed dividers. Fill it with Stat. */
export function StatGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-6 rounded-xl border bg-muted p-6 sm:grid-cols-2 xl:grid-cols-4",
        "xl:[&>*:not(:first-child)]:border-l xl:[&>*:not(:first-child)]:border-dashed xl:[&>*:not(:first-child)]:border-muted-foreground/30 xl:[&>*:not(:first-child)]:pl-6",
        className
      )}
      {...props}
    />
  );
}

interface StatProps
  extends
    Omit<React.ComponentProps<"div">, "children">,
    MixinProps<"label", React.ComponentProps<"p">>,
    MixinProps<"value", React.ComponentProps<"p">>,
    MixinProps<"sparkline", Omit<React.ComponentProps<typeof Sparkline>, "data">> {
  label: React.ReactNode;
  value: React.ReactNode;
  trend?: StatTrend;
  sparklineData?: number[];
}

export function Stat({ label, value, trend, sparklineData, className, ...mixProps }: StatProps) {
  const {
    label: labelProps,
    value: valueProps,
    sparkline: sparklineProps,
    rest,
  } = splitProps(mixProps, "label", "value", "sparkline");

  const trendIcon = trend?.direction === "down" ? ArrowDown02Icon : ArrowUp02Icon;

  return (
    <div {...rest} className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-2.5">
        <p {...labelProps} className={cn("text-sm text-muted-foreground", labelProps.className)}>
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-x-2">
          <p {...valueProps} className={cn("text-2xl font-semibold tracking-tight", valueProps.className)}>
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                trend.tone === "negative" ? "text-destructive" : "text-foreground"
              )}
            >
              <HugeiconsIcon icon={trendIcon} aria-hidden className="size-3" />
              <span className="sr-only">{trend.direction === "down" ? "Down" : "Up"}</span>
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {sparklineData && (
        <Sparkline {...sparklineProps} data={sparklineData} className={cn("shrink-0", sparklineProps.className)} />
      )}
    </div>
  );
}
