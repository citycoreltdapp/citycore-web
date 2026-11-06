"use client";

import * as React from "react";

import {
  type BaseChartData,
  type ChartColor,
  type ChartLabelFormatter,
  type ChartTooltipProps,
  chartTooltipContent,
} from "@/components/primitives/area-chart";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatChartLabel } from "@/lib/chart-label";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface LineChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children">,
    MixinProps<"xAxis", Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">>,
    MixinProps<"yAxis", Omit<React.ComponentProps<typeof YAxis>, "hide" | "key" | "ref">>,
    MixinProps<"tooltip", ChartTooltipProps>,
    MixinProps<"line", Omit<React.ComponentProps<typeof Area>, "dataKey" | "key" | "ref">>,
    MixinProps<"grid", Omit<React.ComponentProps<typeof CartesianGrid>, "key" | "ref">> {
  data: T[];
  config: ChartConfig;
  xAxisKey: Extract<keyof T, string>;
  activeKey: Extract<keyof T, string>;
  color: ChartColor;
  xAxisFormatter?: ChartLabelFormatter;
  tooltipLabelFormatter?: ChartLabelFormatter;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showGrid?: boolean;
  showYAxis?: boolean;
  /** How strong the fill under the line is, from 0 to 1. */
  gradientOpacity?: number;
}

/** A thin line over a soft gradient. Built on an area so the gradient has something to fill. */
export function LineChart<T extends BaseChartData>({
  data,
  config,
  xAxisKey,
  activeKey,
  color,
  xAxisFormatter = formatChartLabel,
  tooltipLabelFormatter = formatChartLabel,
  className,
  showTooltip = true,
  showXAxis = true,
  showGrid = true,
  showYAxis = false,
  gradientOpacity = 0.14,
  ...mixProps
}: LineChartProps<T>) {
  const gradientId = `line-gradient-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const { xAxis, yAxis, tooltip, line, grid, rest } = splitProps(mixProps, "xAxis", "yAxis", "tooltip", "line", "grid");

  return (
    <ChartContainer
      role="img"
      aria-label={String(config[activeKey]?.label ?? "Line chart")}
      {...rest}
      config={config}
      className={cn("aspect-auto h-62.5 w-full", className)}
    >
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={gradientOpacity} />
            <stop offset="75%" stopColor={color} stopOpacity={gradientOpacity * 0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <YAxis
          domain={[0, (max: number) => (max === 0 ? 10 : max * 1.15)]}
          tickLine={false}
          axisLine={false}
          width={44}
          {...yAxis}
          hide={!showYAxis}
        />

        {showGrid && <CartesianGrid vertical={false} {...grid} />}

        {showXAxis && (
          <XAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            interval="preserveStartEnd"
            tickFormatter={xAxisFormatter}
            {...xAxis}
            dataKey={xAxisKey}
          />
        )}

        {showTooltip && <ChartTooltip content={chartTooltipContent(activeKey, tooltipLabelFormatter, tooltip)} />}

        <Area
          type="monotone"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
          {...line}
          dataKey={activeKey}
        />
      </AreaChart>
    </ChartContainer>
  );
}
