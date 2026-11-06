import * as React from "react";

import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";

interface ProgressRingProps
  extends
    Omit<React.ComponentProps<"div">, "children">,
    MixinProps<"track", Pick<React.ComponentProps<"circle">, "className">>,
    MixinProps<"indicator", Pick<React.ComponentProps<"circle">, "className">> {
  /** From 0 to 100. */
  value: number;
  /** Shown in the middle. Defaults to the value as a percentage. */
  label?: React.ReactNode;
}

const RADIUS = 42;

/** A small ring showing one percentage. Use DonutChart for several slices. */
export function ProgressRing({ value, label, className, ...mixProps }: ProgressRingProps) {
  const { track, indicator, rest } = splitProps(mixProps, "track", "indicator");
  const percent = Math.min(Math.max(value, 0), 100);

  return (
    <div
      role="img"
      aria-label={`${percent}%`}
      {...rest}
      className={cn("relative flex size-16 shrink-0 items-center justify-center", className)}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          className={cn("stroke-chart-3", track.className)}
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          className={cn("stroke-primary", indicator.className)}
        />
      </svg>
      <span className="text-xs font-semibold">{label ?? `${percent}%`}</span>
    </div>
  );
}
