import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dollar01Icon, EuroIcon, PoundIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import type { BaseChartData } from "./area-chart";
import { MultiLineChart, type MultiLineSeries } from "./multi-line-chart";
import { SelectField } from "./select-field";
import { Stat, StatGroup } from "./stat-group";

const accountBalance = [
  { month: "Jan", recentYear: 20, lastFiveYears: 85 },
  { month: "Feb", recentYear: 38, lastFiveYears: 65 },
  { month: "Mar", recentYear: 38, lastFiveYears: 75 },
  { month: "Apr", recentYear: 72, lastFiveYears: 38 },
  { month: "May", recentYear: 55, lastFiveYears: 85 },
  { month: "Jun", recentYear: 63, lastFiveYears: 35 },
  { month: "Jul", recentYear: 43, lastFiveYears: 62 },
  { month: "Aug", recentYear: 76, lastFiveYears: 40 },
  { month: "Sep", recentYear: 55, lastFiveYears: 40 },
  { month: "Oct", recentYear: 80, lastFiveYears: 64 },
  { month: "Nov", recentYear: 40, lastFiveYears: 50 },
  { month: "Dec", recentYear: 80, lastFiveYears: 89 },
];

const series: MultiLineSeries<BaseChartData>[] = [
  { key: "recentYear", label: "Recent year", color: "var(--chart-1)", strokeOpacity: 0.75 },
  { key: "lastFiveYears", label: "Last 5 years", color: "var(--chart-3)", strokeDasharray: "1 6" },
];

const meta = {
  title: "Primitives/MultiLineChart",
  component: MultiLineChart<BaseChartData>,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    data: accountBalance,
    xAxisKey: "month",
    series,
    xAxisInterval: 0,
    yAxisDomain: [0, 100],
    yAxisTicks: [0, 20, 40, 60, 80, 100],
  },
  argTypes: {
    showYAxis: { control: "boolean" },
    showGrid: { control: "boolean" },
    showLegend: { control: "boolean" },
    showTooltip: { control: "boolean" },
  },
} satisfies Meta<typeof MultiLineChart<BaseChartData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutYAxisOrGrid: Story = { args: { showYAxis: false, showGrid: false } };

export const WithoutLegend: Story = { args: { showLegend: false } };

export const SingleSeries: Story = { args: { series: [series[0]] } };

export const HorizontalGridOnly: Story = { args: { gridVertical: false } };

const trendData = [30, 55, 50, 85, 45, 60, 35, 55, 30, 62];

const AccountOverviewHeader = () => {
  const [currency, setCurrency] = React.useState("usd");
  const [period, setPeriod] = React.useState("recent-years");
  return (
    <CardHeader className="mx-7 mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-dashed px-0 py-0 pb-5">
      <CardTitle className="text-2xl font-semibold">Account Overview</CardTitle>
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <SelectField
          id="account-overview-currency"
          value={currency}
          onChange={setCurrency}
          items={[
            { value: "usd", label: "USD", icon: <HugeiconsIcon icon={Dollar01Icon} /> },
            { value: "eur", label: "EUR", icon: <HugeiconsIcon icon={EuroIcon} /> },
            { value: "gbp", label: "GBP", icon: <HugeiconsIcon icon={PoundIcon} /> },
          ]}
          triggerAria-label="Currency"
          triggerClassName="h-10! w-28 rounded-lg bg-muted/50"
        />
        <SelectField
          id="account-overview-period"
          label="Sort By :"
          value={period}
          onChange={setPeriod}
          items={[
            { value: "recent-years", label: "Recent years" },
            { value: "last-5-years", label: "Last 5 years" },
          ]}
          className="flex-row items-center"
          labelClassName="font-normal whitespace-nowrap text-muted-foreground"
          triggerClassName="h-10! w-36 rounded-lg bg-muted/50"
        />
      </div>
    </CardHeader>
  );
};

export const AccountOverview: Story = {
  decorators: [
    (Story) => (
      <Card className="gap-0 rounded-xl py-0 shadow-sm ring-0">
        <AccountOverviewHeader />
        <CardContent className="flex flex-col gap-8 px-7 py-6">
          <StatGroup>
            <Stat
              label="Total Balance"
              value="₦98.500"
              trend={{ value: "50.8%", direction: "up" }}
              sparklineData={trendData}
            />
            <Stat
              label="Total Deposits"
              value="₦22.745"
              trend={{ value: "17.9%", direction: "up", tone: "negative" }}
              sparklineData={trendData}
            />
            <Stat
              label="Yearly In"
              value="₦33.223"
              trend={{ value: "66.3%", direction: "up" }}
              sparklineData={trendData}
            />
            <Stat
              label="Yearly Out"
              value="₦45.654"
              trend={{ value: "76.7%", direction: "down", tone: "negative" }}
              sparklineData={trendData}
            />
          </StatGroup>
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  args: {
    className: "h-110",
    legendClassName: "pt-3",
    yAxisLabel: {
      value: "Account Balance",
      angle: -90,
      position: "insideLeft",
      offset: 12,
      fill: "var(--foreground)",
      fontWeight: 500,
    },
    yAxisWidth: 60,
  },
};
