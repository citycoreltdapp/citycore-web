import type { Meta, StoryObj } from "@storybook/react-vite";

import type { BaseChartData } from "./area-chart";
import { LineChart } from "./line-chart";

const visitorsData = [
  { date: "2024-03-13", visitors: 186 },
  { date: "2024-03-14", visitors: 305 },
  { date: "2024-03-15", visitors: 237 },
  { date: "2024-03-16", visitors: 273 },
  { date: "2024-03-17", visitors: 209 },
  { date: "2024-03-18", visitors: 314 },
  { date: "2024-03-19", visitors: 290 },
];

const visitorsConfig = { visitors: { label: "Visitors", color: "var(--chart-1)" } };

const meta = {
  title: "Primitives/LineChart",
  component: LineChart<BaseChartData>,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    data: visitorsData,
    config: visitorsConfig,
    xAxisKey: "date",
    activeKey: "visitors",
    color: "var(--chart-1)",
  },
  argTypes: {
    showTooltip: { control: "boolean" },
    showXAxis: { control: "boolean" },
    showGrid: { control: "boolean" },
    color: {
      control: "select",
      options: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-125">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart<BaseChartData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutGrid: Story = { args: { showGrid: false } };

export const WithoutAxisOrTooltip: Story = { args: { showXAxis: false, showTooltip: false } };

export const WithYAxis: Story = {
  args: { showYAxis: true, yAxisTickFormatter: (value: number) => value.toLocaleString(), gradientOpacity: 0.45 },
};

export const AllZeros: Story = {
  args: { data: visitorsData.map((point) => ({ ...point, visitors: 0 })) },
};

export const WithMixins: Story = {
  args: {
    lineStrokeWidth: 3,
    lineType: "linear",
    gridStrokeDasharray: "4 4",
    color: "var(--chart-2)",
  },
};
