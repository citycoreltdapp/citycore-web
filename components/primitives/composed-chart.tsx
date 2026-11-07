"use client";

import * as React from "react";

import { type BaseChartData, type ChartTooltipProps } from "@/components/primitives/area-chart";
import { ChartDotLegend } from "@/components/primitives/chart-dot-legend";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatChartLabel } from "@/lib/chart-label";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { Area, Bar, CartesianGrid, Line, ComposedChart as RechartsComposedChart, XAxis, YAxis } from "recharts";

export interface ComposedChartSeries<T extends BaseChartData> {
  key: Extract<keyof T, string>;
  label: string;
  type: "bar" | "area" | "line";
  color: string;
  dashed?: boolean;
}

interface ComposedChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children" | "config">,
    MixinProps<"xAxis", Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">>,
    MixinProps<"yAxis", Omit<React.ComponentProps<typeof YAxis>, "key" | "ref">>,
    MixinProps<"tooltip", ChartTooltipProps>,
    MixinProps<"grid", Omit<React.ComponentProps<typeof CartesianGrid>, "key" | "ref">>,
    MixinProps<"legend", { className?: string }> {
  data: T[];
  xAxisKey: Extract<keyof T, string>;
  /** Drawn areas first, then bars, then lines, whatever the order here. This order is the legend's. */
  series: ComposedChartSeries<T>[];
  barSize?: number;
  showLegend?: boolean;
}

/** Bars, areas and lines on one set of axes. */
export function ComposedChart<T extends BaseChartData>({
  data,
  xAxisKey,
  series,
  barSize = 12,
  showLegend = true,
  className,
  ...mixProps
}: ComposedChartProps<T>) {
  const { xAxis, yAxis, tooltip, grid, legend, rest } = splitProps(
    mixProps,
    "xAxis",
    "yAxis",
    "tooltip",
    "grid",
    "legend"
  );

  const idPrefix = `composed-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const config: ChartConfig = Object.fromEntries(series.map(({ key, label, color }) => [key, { label, color }]));
  const ofType = (type: ComposedChartSeries<T>["type"]) => series.filter((item) => item.type === type);

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer
        role="img"
        aria-label={series.map((item) => item.label).join(", ")}
        {...rest}
        config={config}
        className={cn("aspect-auto h-80 w-full", className)}
      >
        <RechartsComposedChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            {ofType("area").map(({ key, color }) => (
              <linearGradient key={key} id={`${idPrefix}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid vertical={false} {...grid} />
          <XAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            tickFormatter={formatChartLabel}
            {...xAxis}
            dataKey={xAxisKey}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} {...yAxis} />
          <ChartTooltip content={<ChartTooltipContent {...tooltip} />} />

          {ofType("area").map(({ key, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${idPrefix}-${key})`}
              dot={false}
            />
          ))}
          {ofType("bar").map(({ key, color }) => (
            <Bar key={key} dataKey={key} fill={color} barSize={barSize} radius={[3, 3, 0, 0]} />
          ))}
          {ofType("line").map(({ key, color, dashed }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={dashed ? "5 4" : undefined}
              dot={false}
            />
          ))}
        </RechartsComposedChart>
      </ChartContainer>

      {showLegend && (
        <ChartDotLegend
          className={legend.className}
          items={series.map(({ key, label, color }) => ({ key, label, color }))}
        />
      )}
    </div>
  );
}
