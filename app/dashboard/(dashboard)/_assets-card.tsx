"use client";

import * as React from "react";

import { LineChart } from "@/components/primitives/line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import { ASSET_RANGES, type AssetRange, getAssetHistory } from "./_data";

const CHART_CONFIG = { value: { label: "Assets" } } satisfies ChartConfig;

export function AssetsCard() {
  const [range, setRange] = React.useState<AssetRange>("1W");
  // Every month has 12 points, so without an interval the same month label prints twice. Phones show every third month.
  const isMobile = useIsMobile();

  return (
    <Card className="ring-0">
      <CardHeader className="flex items-center justify-between gap-3 border-b border-dashed px-5 pb-4">
        <CardTitle className="text-lg font-semibold">Your Assets</CardTitle>
        <Tabs value={range} onValueChange={(next) => setRange(next as AssetRange)}>
          <TabsList aria-label="Time range" className="gap-1 bg-transparent p-0">
            {ASSET_RANGES.map((option) => (
              <TabsTrigger
                key={option}
                value={option}
                className="h-7 rounded-sm bg-muted px-3 text-xs data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary"
              >
                {option}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-5">
        <LineChart
          data={getAssetHistory(range)}
          config={CHART_CONFIG}
          xAxisKey="period"
          xAxisInterval={isMobile ? 35 : 11}
          activeKey="value"
          color="var(--chart-4)"
          className="h-72"
          showYAxis
          yAxisDomain={[27, 42]}
          yAxisTicks={[27, 30, 33, 36, 39, 42]}
          yAxisTickFormatter={(value: number) => value.toFixed(2)}
          gradientOpacity={0.45}
        />
      </CardContent>
    </Card>
  );
}
