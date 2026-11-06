import type { Meta, StoryObj } from "@storybook/react-vite";

import { AreaChart, type BaseChartData } from "./area-chart";

const revenueData = [
  { date: "2024-03-13", revenue: 1200 },
  { date: "2024-03-14", revenue: 1900 },
  { date: "2024-03-15", revenue: 1500 },
  { date: "2024-03-16", revenue: 2100 },
  { date: "2024-03-17", revenue: 1800 },
  { date: "2024-03-18", revenue: 2400 },
  { date: "2024-03-19", revenue: 2200 },
];

const revenueConfig = { revenue: { label: "Revenue", color: "var(--chart-1)" } };

const longSeriesData = Array.from({ length: 30 }, (_, i) => ({
  date: `2024-04-${String(i + 1).padStart(2, "0")}`,
  revenue: Math.round(1500 + Math.sin(i / 4) * 800),
}));

const viewsData = [
  { week: "Week 1", views: 4200 },
  { week: "Week 2", views: 3800 },
  { week: "Week 3", views: 5100 },
  { week: "Week 4", views: 4600 },
  { week: "Week 5", views: 5900 },
];

const meta = {
  title: "Primitives/AreaChart",
  component: AreaChart<BaseChartData>,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    data: revenueData,
    config: revenueConfig,
    xAxisKey: "date",
    activeKey: "revenue",
    color: "var(--chart-1)",
  },
  argTypes: {
    showTooltip: { control: "boolean" },
    showXAxis: { control: "boolean" },
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
} satisfies Meta<typeof AreaChart<BaseChartData>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongSeries: Story = { args: { data: longSeriesData } };

export const TextLabels: Story = {
  args: {
    data: viewsData,
    config: { views: { label: "Page views", color: "var(--chart-2)" } },
    xAxisKey: "week",
    activeKey: "views",
    color: "var(--chart-2)",
  },
};

export const CustomFormatters: Story = {
  args: {
    xAxisFormatter: (value) => `${String(value).slice(5)}`,
    tooltipLabelFormatter: (value) => `Day: ${value}`,
    color: "var(--chart-3)",
  },
};

export const WithoutAxisOrTooltip: Story = { args: { showXAxis: false, showTooltip: false } };

export const WithMixins: Story = {
  args: {
    areaType: "step",
    areaFillOpacity: 0.4,
    gridVertical: true,
    xAxisTickMargin: 16,
    tooltipIndicator: "line",
    color: "var(--chart-4)",
  },
};
