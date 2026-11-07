"use client";

import * as React from "react";

import { CardMenu } from "@/components/dashboard/card-menu";
import { DonutChart } from "@/components/primitives/donut-chart";
import { MultiAreaChart } from "@/components/primitives/multi-area-chart";
import { SelectField } from "@/components/primitives/select-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferenceLine } from "recharts";

import { BALANCES, TOTAL_BALANCE, TRANSFERS_BY_PERIOD, TRANSFER_PERIODS } from "./_data";

const BALANCE_MENU_ITEMS = ["Print data", "Reset data", "Download data"];
const TRANSFER_SERIES = [
  { key: "usd", label: "USD", color: "var(--chart-1)", fillColor: "var(--chart-4)", fillOpacity: 0.55 },
  { key: "eur", label: "EUR", color: "var(--chart-3)", dashed: true },
] as const;
const Y_AXIS_TICKS = [0, 60, 120, 180, 240, 300];

const TOTAL_SHARE = BALANCES.reduce((sum, { value }) => sum + value, 0);

export function AccountBalanceCard() {
  return (
    <Card className="rounded-2xl ring-foreground/8">
      <CardHeader className="flex items-center justify-between border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Account Balance</CardTitle>
        <CardMenu label="Account Balance" items={BALANCE_MENU_ITEMS} />
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5">
        <DonutChart
          data={BALANCES}
          centerValue={<span className="font-light tabular-nums">{TOTAL_BALANCE}</span>}
          centerLabel="Total Balance"
          showLegend={false}
          className="max-h-56"
        />
        <ul className="flex flex-col gap-2.5 border-t border-border pt-4">
          {BALANCES.map(({ key, label, displayValue, value, color }) => (
            <li key={key} className="flex items-center gap-2.5 text-sm">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{label}</span>
              <span className="ml-auto font-semibold tabular-nums">{displayValue}</span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round((value / TOTAL_SHARE) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function TransferStatCard() {
  const [period, setPeriod] = React.useState(TRANSFER_PERIODS[0].value);

  return (
    <Card className="min-w-0 rounded-2xl ring-foreground/8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 pb-4">
        <CardTitle className="text-base font-semibold">Transfer Stat</CardTitle>
        <SelectField
          id="transfer-stat-period"
          value={period}
          onChange={setPeriod}
          items={TRANSFER_PERIODS}
          triggerAria-label="Period"
          triggerClassName="w-32 rounded-full px-3.5"
          triggerSize="sm"
        />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5">
        <MultiAreaChart
          data={TRANSFERS_BY_PERIOD[period]}
          xAxisKey="month"
          series={[...TRANSFER_SERIES]}
          yAxisDomain={[0, 300]}
          yAxisTicks={Y_AXIS_TICKS}
          gridStrokeDasharray="4 4"
        >
          <ReferenceLine x="Jul" stroke="var(--border)" strokeDasharray="4 4" />
        </MultiAreaChart>
      </CardContent>
    </Card>
  );
}
