import type { Meta, StoryObj } from "@storybook/react-vite";

import type { BaseChartData } from "./area-chart";
import { ComposedChart, type ComposedChartSeries } from "./composed-chart";

const data = [
  { month: "Jan", volume: 80, trend: 30, average: 12 },
  { month: "Feb", volume: 95, trend: 40, average: 18 },
  { month: "Mar", volume: 68, trend: 52, average: 15 },
  { month: "Apr", volume: 110, trend: 60, average: 22 },
  { month: "May", volume: 78, trend: 48, average: 14 },
  { month: "Jun", volume: 84, trend: 42, average: 20 },
];

const series: ComposedChartSeries<BaseChartData>[] = [
  { key: "volume", label: "Volume", type: "bar", color: "var(--chart-1)" },
  { key: "trend", label: "Trend", type: "area", color: "var(--chart-3)" },
  { key: "average", label: "Average", type: "line", color: "var(--chart-2)", dashed: true },
];

const meta = {
  title: "Primitives/ComposedChart",
  component: ComposedChart<BaseChartData>,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { data, xAxisKey: "month", series, yAxisDomain: [0, 120], yAxisTicks: [0, 30, 60, 90, 120] },
  argTypes: { showLegend: { control: "boolean" }, barSize: { control: "number" } },
} satisfies Meta<typeof ComposedChart<BaseChartData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLegend: Story = { args: { showLegend: false } };

export const BarsOnly: Story = { args: { series: series.slice(0, 1), barSize: 20 } };
