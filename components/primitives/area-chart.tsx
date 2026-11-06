"use client";

import * as React from "react";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatChartLabel } from "@/lib/chart-label";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { Area, CartesianGrid, AreaChart as RechartsAreaChart, XAxis } from "recharts";

export type BaseChartData = Record<string, string | number>;

export type ChartColor = "var(--chart-1)" | "var(--chart-2)" | "var(--chart-3)" | "var(--chart-4)" | "var(--chart-5)";

export type ChartLabelFormatter = (value: string | number) => string;

export type ChartTooltipProps = Omit<
  React.ComponentProps<typeof ChartTooltipContent>,
  "nameKey" | "labelFormatter" | "key" | "ref"
>;

/** The tooltip AreaChart and LineChart share. */
export const chartTooltipContent = (activeKey: string, format: ChartLabelFormatter, tooltip: ChartTooltipProps) => (
  <ChartTooltipContent
    {...tooltip}
    className={cn("w-fit min-w-30 gap-1 px-2 py-1.5 text-[11px]", tooltip.className)}
    nameKey={activeKey}
    labelFormatter={(label) => format(label as string | number)}
  />
);

interface AreaChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children">,
    MixinProps<"xAxis", Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">>,
    MixinProps<"tooltip", ChartTooltipProps>,
    MixinProps<"area", Omit<React.ComponentProps<typeof Area>, "dataKey" | "key" | "ref">>,
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
}

export function AreaChart<T extends BaseChartData>({
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
  ...mixProps
}: AreaChartProps<T>) {
  const { xAxis, tooltip, area, grid, rest } = splitProps(mixProps, "xAxis", "tooltip", "area", "grid");

  return (
    <ChartContainer
      role="img"
      aria-label={String(config[activeKey]?.label ?? "Area chart")}
      {...rest}
      config={config}
      className={cn("aspect-auto h-62.5 w-full", className)}
    >
      <RechartsAreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} {...grid} />

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
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
          {...area}
          dataKey={activeKey}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
}
