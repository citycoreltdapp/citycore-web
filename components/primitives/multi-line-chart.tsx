"use client";

import * as React from "react";

import { type BaseChartData, type ChartTooltipProps } from "@/components/primitives/area-chart";
import { ChartDotLegend } from "@/components/primitives/chart-dot-legend";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatChartLabel } from "@/lib/chart-label";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";

export interface MultiLineSeries<T extends BaseChartData> {
  key: Extract<keyof T, string>;
  label: string;
  /** The line and legend dot. */
  color: string;
  /** Softens the line without changing the legend dot. */
  strokeOpacity?: number;
  /** Such as "1 6" for dots. */
  strokeDasharray?: string;
}

interface MultiLineChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children" | "config">,
    MixinProps<"xAxis", Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">>,
    MixinProps<"yAxis", Omit<React.ComponentProps<typeof YAxis>, "key" | "ref">>,
    MixinProps<"tooltip", ChartTooltipProps>,
    MixinProps<"grid", Omit<React.ComponentProps<typeof CartesianGrid>, "key" | "ref">>,
    MixinProps<"legend", { className?: string }> {
  data: T[];
  xAxisKey: Extract<keyof T, string>;
  /** Top layer first, which is also the legend order. */
  series: MultiLineSeries<T>[];
  xAxisFormatter?: (value: string | number) => string;
  showYAxis?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Extra Recharts elements, such as a ReferenceLine. */
  children?: React.ReactNode;
}

/** Plain lines with no fill, for comparing series. For one line over a gradient, use LineChart. */
export function MultiLineChart<T extends BaseChartData>({
  data,
  xAxisKey,
  series,
  xAxisFormatter = formatChartLabel,
  showYAxis = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  children,
  ...mixProps
}: MultiLineChartProps<T>) {
  const { xAxis, yAxis, tooltip, grid, legend, rest } = splitProps(
    mixProps,
    "xAxis",
    "yAxis",
    "tooltip",
    "grid",
    "legend"
  );

  const config: ChartConfig = Object.fromEntries(series.map(({ key, label, color }) => [key, { label, color }]));

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer
        role="img"
        aria-label={series.map((s) => s.label).join(" and ")}
        {...rest}
        config={config}
        className={cn("aspect-auto h-96 w-full", className)}
      >
        <RechartsLineChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          {showGrid && <CartesianGrid {...grid} />}

          <XAxis
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            interval="preserveStartEnd"
            tickFormatter={xAxisFormatter}
            {...xAxis}
            dataKey={xAxisKey}
          />

          {showYAxis && <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} {...yAxis} />}

          {showTooltip && (
            <ChartTooltip
              itemSorter={(item) => series.findIndex((s) => s.key === item.dataKey)}
              content={
                <ChartTooltipContent
                  {...tooltip}
                  labelFormatter={(label) => xAxisFormatter(label as string | number)}
                />
              }
            />
          )}

          {children}

          {series.toReversed().map(({ key, color, strokeOpacity, strokeDasharray }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeOpacity={strokeOpacity}
              strokeDasharray={strokeDasharray}
              strokeWidth={2.5}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </RechartsLineChart>
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
