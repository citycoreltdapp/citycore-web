"use client";

import * as React from "react";

import { MultiLineChart } from "@/components/primitives/multi-line-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Stat, StatGroup } from "@/components/primitives/stat-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CURRENCIES, REPORT_CHART, REPORT_PERIODS, REPORT_STATS, REPORT_TREND } from "../_data";

const SERIES = [
  { key: "recentYear", label: "Recent year", color: "var(--chart-1)", strokeOpacity: 0.75 },
  { key: "lastFiveYears", label: "Last 5 years", color: "var(--chart-3)", strokeDasharray: "1 6" },
] as const;

const Y_AXIS_TICKS = [0, 20, 40, 60, 80, 100];

const downloadCsv = (rows: typeof REPORT_CHART) => {
  const csv = [
    "Month,Recent year,Last 5 years",
    ...rows.map((row) => `${row.month},${row.recentYear},${row.lastFiveYears}`),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "yearly-report.csv";
  link.click();
  URL.revokeObjectURL(url);
};

export default function Client$ReportsPage() {
  const [currency, setCurrency] = React.useState(CURRENCIES[0].value);
  const [period, setPeriod] = React.useState(REPORT_PERIODS[0].value);
  const isMobile = useIsMobile();

  const rate = CURRENCIES.find((option) => option.value === currency)?.rate ?? 1;
  const scale = REPORT_PERIODS.find((option) => option.value === period)?.scale ?? 1;
  const chartRows = REPORT_CHART.map(({ month, recentYear, lastFiveYears }) => ({
    month,
    recentYear: Math.round(recentYear * scale),
    lastFiveYears: Math.round(lastFiveYears * scale),
  }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Yearly Reports</h1>
        <Button className="h-10 rounded-full px-4" onClick={() => downloadCsv(chartRows)}>
          <HugeiconsIcon icon={AddCircleIcon} aria-hidden />
          Export Data
        </Button>
      </div>

      <Card className="ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed px-5 pb-4">
          <CardTitle className="text-lg font-semibold">Account Overview</CardTitle>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <SelectField
              id="report-currency"
              value={currency}
              onChange={setCurrency}
              items={CURRENCIES}
              triggerAria-label="Currency"
              triggerClassName="h-10! w-24 rounded-lg bg-muted/50"
            />
            <SelectField
              id="report-period"
              label="Sort By :"
              value={period}
              onChange={setPeriod}
              items={REPORT_PERIODS}
              className="flex-row items-center"
              labelClassName="font-normal whitespace-nowrap text-muted-foreground"
              triggerClassName="h-10! w-36 rounded-lg bg-muted/50"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 px-5">
          <StatGroup>
            {REPORT_STATS.map(({ label, value, trend }) => (
              <Stat
                key={label}
                label={label}
                value={`₦${(value * rate * scale).toFixed(3)}`}
                trend={trend}
                sparklineData={REPORT_TREND}
              />
            ))}
          </StatGroup>

          <MultiLineChart
            data={chartRows}
            xAxisKey="month"
            series={[...SERIES]}
            xAxisInterval={isMobile ? 2 : 0}
            yAxisDomain={[0, 100]}
            yAxisTicks={Y_AXIS_TICKS}
            yAxisLabel={{
              value: "Account Balance",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              fill: "var(--foreground)",
              fontWeight: 500,
            }}
            yAxisWidth={60}
            className="h-80 md:h-110"
            legendClassName="pt-3"
          />
        </CardContent>
      </Card>
    </>
  );
}
