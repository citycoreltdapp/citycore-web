"use client";

import * as React from "react";

import { type BaseChartData, type ChartTooltipProps } from "@/components/primitives/area-chart";
import { ChartDotLegend } from "@/components/primitives/chart-dot-legend";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatChartLabel } from "@/lib/chart-label";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export interface MultiAreaSeries<T extends BaseChartData> {
  key: Extract<keyof T, string>;
  label: string;
  /** The line and legend dot. */
  color: string;
  /** The gradient under the line. Defaults to the line color. */
  fillColor?: string;
  /** How strong the gradient is at the top of the chart. */
  fillOpacity?: number;
  dashed?: boolean;
}

interface MultiAreaChartProps<T extends BaseChartData>
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children" | "config">,
    MixinProps<"xAxis", Omit<React.ComponentProps<typeof XAxis>, "dataKey" | "key" | "ref">>,
    MixinProps<"yAxis", Omit<React.ComponentProps<typeof YAxis>, "key" | "ref">>,
    MixinProps<"tooltip", ChartTooltipProps>,
    MixinProps<"grid", Omit<React.ComponentProps<typeof CartesianGrid>, "key" | "ref">>,
    MixinProps<"legend", { className?: string }> {
  data: T[];
  xAxisKey: Extract<keyof T, string>;
  /** Top layer first, which is also the legend order. Series overlap; they aren't stacked. */
  series: MultiAreaSeries<T>[];
  xAxisFormatter?: (value: string | number) => string;
  showYAxis?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Extra Recharts elements, such as a ReferenceLine. */
  children?: React.ReactNode;
}

export function MultiAreaChart<T extends BaseChartData>({
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
}: MultiAreaChartProps<T>) {
  const { xAxis, yAxis, tooltip, grid, legend, rest } = splitProps(
    mixProps,
    "xAxis",
    "yAxis",
    "tooltip",
    "grid",
    "legend"
  );

  const idPrefix = `multi-area-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const config: ChartConfig = Object.fromEntries(series.map(({ key, label, color }) => [key, { label, color }]));

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer
        role="img"
        aria-label={series.map((s) => s.label).join(" and ")}
        {...rest}
        config={config}
        className={cn("aspect-auto h-80 w-full", className)}
      >
        <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            {series.map(({ key, color, fillColor = color, fillOpacity = 0.3 }) => (
              <linearGradient key={key} id={`${idPrefix}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacity} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && <CartesianGrid vertical={false} {...grid} />}

          <XAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
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

          {series.toReversed().map(({ key, color, dashed }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={dashed ? "5 4" : undefined}
              fill={`url(#${idPrefix}-${key})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
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
