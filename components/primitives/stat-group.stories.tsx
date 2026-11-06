import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stat, StatGroup } from "./stat-group";

const trendData = [30, 55, 50, 85, 45, 60, 35, 55, 30, 62];

const meta = {
  title: "Primitives/StatGroup",
  component: StatGroup,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof StatGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
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
      <Stat label="Yearly In" value="₦33.223" trend={{ value: "66.3%", direction: "up" }} sparklineData={trendData} />
      <Stat
        label="Yearly Out"
        value="₦45.654"
        trend={{ value: "76.7%", direction: "down", tone: "negative" }}
        sparklineData={trendData}
      />
    </StatGroup>
  ),
};

export const WithoutSparklines: Story = {
  render: () => (
    <StatGroup className="xl:grid-cols-2">
      <Stat label="Total Balance" value="₦98.500" trend={{ value: "50.8%", direction: "up" }} />
      <Stat label="Yearly Out" value="₦45.654" trend={{ value: "76.7%", direction: "down", tone: "negative" }} />
    </StatGroup>
  ),
};

export const WithoutTrend: Story = {
  render: () => (
    <StatGroup className="xl:grid-cols-1">
      <Stat label="Total Balance" value="₦98.500" sparklineData={trendData} />
    </StatGroup>
  ),
};

export const WithMixins: Story = {
  render: () => (
    <StatGroup className="xl:grid-cols-1">
      <Stat
        label="Total Balance"
        value="₦98.500"
        trend={{ value: "50.8%", direction: "up" }}
        sparklineData={trendData}
        labelClassName="text-primary"
        valueClassName="text-3xl"
        sparklineColor="var(--chart-2)"
      />
    </StatGroup>
  ),
};
