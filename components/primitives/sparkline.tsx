"use client";

import * as React from "react";

import { ChartContainer } from "@/components/ui/chart";
import { cn } from "cn";
import { Area, AreaChart, YAxis } from "recharts";

interface SparklineProps extends Omit<React.ComponentProps<typeof ChartContainer>, "children" | "config"> {
  data: number[];
  /** The line. */
  color?: string;
  /** The gradient under the line. */
  fillColor?: string;
}

/** A tiny trend line with no axes, for use beside a figure. */
export function Sparkline({
  data,
  color = "var(--chart-1)",
  fillColor = "var(--chart-4)",
  className,
  ...rest
}: SparklineProps) {
  const gradientId = `sparkline-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const points = data.map((value) => ({ value }));

  return (
    <ChartContainer
      aria-hidden
      {...rest}
      config={{}}
      initialDimension={{ width: 96, height: 56 }}
      className={cn("aspect-auto h-14 w-24", className)}
    >
      <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin - 20", "dataMax"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
