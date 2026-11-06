import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReferenceLine } from "recharts";

import type { BaseChartData } from "./area-chart";
import { MultiAreaChart, type MultiAreaSeries } from "./multi-area-chart";
import { SelectField } from "./select-field";

const transfers = [
  { month: "Jan", usd: 0, eur: 0 },
  { month: "Feb", usd: 60, eur: 105 },
  { month: "Mar", usd: 20, eur: 30 },
  { month: "Apr", usd: 90, eur: 165 },
  { month: "May", usd: 45, eur: 80 },
  { month: "Jun", usd: 110, eur: 205 },
  { month: "Jul", usd: 55, eur: 95 },
  { month: "Aug", usd: 130, eur: 245 },
  { month: "Sep", usd: 45, eur: 75 },
  { month: "Oct", usd: 110, eur: 215 },
  { month: "Nov", usd: 75, eur: 140 },
  { month: "Dec", usd: 120, eur: 230 },
];

const series: MultiAreaSeries<BaseChartData>[] = [
  { key: "usd", label: "USD", color: "var(--chart-1)", fillColor: "var(--chart-4)", fillOpacity: 0.55 },
  { key: "eur", label: "EUR", color: "var(--chart-3)", dashed: true },
];

const meta = {
  title: "Primitives/MultiAreaChart",
  component: MultiAreaChart<BaseChartData>,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    data: transfers,
    xAxisKey: "month",
    series,
    xAxisInterval: 0,
    yAxisDomain: [0, 300],
    yAxisTicks: [0, 60, 120, 180, 240, 300],
    gridStrokeDasharray: "4 4",
  },
  argTypes: {
    showYAxis: { control: "boolean" },
    showGrid: { control: "boolean" },
    showLegend: { control: "boolean" },
    showTooltip: { control: "boolean" },
  },
} satisfies Meta<typeof MultiAreaChart<BaseChartData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutYAxisOrGrid: Story = { args: { showYAxis: false, showGrid: false } };

export const WithoutLegend: Story = { args: { showLegend: false } };

export const SingleSeries: Story = { args: { series: [series[0]] } };

const TransferStatHeader = () => {
  const [period, setPeriod] = React.useState("last-years");
  return (
    <CardHeader className="mx-7 mt-7 flex items-center justify-between border-b border-dashed px-0 py-0 pb-5">
      <CardTitle className="text-2xl font-semibold">Transfer Stat</CardTitle>
      <SelectField
        id="transfer-stat-period"
        label="Sort By :"
        value={period}
        onChange={setPeriod}
        items={[
          { value: "last-years", label: "Last years" },
          { value: "this-year", label: "This year" },
          { value: "last-month", label: "Last month" },
        ]}
        className="flex-row items-center"
        labelClassName="font-normal whitespace-nowrap text-muted-foreground"
        triggerClassName="w-28 rounded-lg bg-muted/50"
        triggerSize="sm"
      />
    </CardHeader>
  );
};

export const TransferStat: Story = {
  decorators: [
    (Story) => (
      <Card className="mx-auto max-w-4xl gap-0 rounded-xl py-0 shadow-sm ring-0">
        <TransferStatHeader />
        <CardContent className="px-7 py-7">
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  args: {
    children: <ReferenceLine x="Jul" stroke="var(--border)" strokeDasharray="4 4" />,
  },
};
