"use client";

import * as React from "react";

import { ChartDotLegend } from "@/components/primitives/chart-dot-legend";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { Pie, PieChart } from "recharts";

export interface DonutChartSlice {
  key: string;
  label: string;
  /** Sets the slice's size. */
  value: number;
  /** Shown before the label in the legend and tooltip, such as "23,232". Defaults to the value. */
  displayValue?: string;
  color: string;
}

interface DonutChartProps
  extends
    Omit<React.ComponentProps<typeof ChartContainer>, "children" | "config">,
    MixinProps<"pie", Omit<React.ComponentProps<typeof Pie>, "data" | "dataKey" | "nameKey" | "key" | "ref">>,
    MixinProps<"legend", { className?: string }> {
  data: DonutChartSlice[];
  centerValue?: React.ReactNode;
  centerLabel?: React.ReactNode;
  showLegend?: boolean;
  showTooltip?: boolean;
}

const sliceText = ({ displayValue, value, label }: DonutChartSlice) =>
  `${displayValue ?? value.toLocaleString()} ${label}`;

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  showLegend = true,
  showTooltip = true,
  className,
  ...mixProps
}: DonutChartProps) {
  const { pie, legend, rest } = splitProps(mixProps, "pie", "legend");

  const config: ChartConfig = Object.fromEntries(data.map(({ key, label, color }) => [key, { label, color }]));
  const slices = data.map((slice) => ({ ...slice, fill: slice.color }));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <ChartContainer
          role="img"
          aria-label={data.map(sliceText).join(", ")}
          {...rest}
          config={config}
          className={cn("mx-auto aspect-square max-h-70", className)}
        >
          <PieChart>
            {showTooltip && (
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(_value, _name, item) => sliceText(item.payload as DonutChartSlice)}
                  />
                }
              />
            )}
            <Pie
              innerRadius="86%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              cornerRadius={20}
              stroke="none"
              {...pie}
              data={slices}
              dataKey="value"
              nameKey="key"
            />
          </PieChart>
        </ChartContainer>

        {(centerValue || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            {centerValue && <span className="text-3xl font-semibold tracking-tight">{centerValue}</span>}
            {centerLabel && <span className="text-sm text-muted-foreground">{centerLabel}</span>}
          </div>
        )}
      </div>

      {showLegend && (
        <ChartDotLegend
          className={legend.className}
          items={data.map((slice) => ({ key: slice.key, label: sliceText(slice), color: slice.color }))}
        />
      )}
    </div>
  );
}
