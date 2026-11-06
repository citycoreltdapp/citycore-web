import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChartDotLegend } from "./chart-dot-legend";

const meta = {
  title: "Primitives/ChartDotLegend",
  component: ChartDotLegend,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    items: [
      { key: "recent-year", label: "Recent year", color: "var(--chart-1)" },
      { key: "last-5-years", label: "Last 5 years", color: "var(--chart-3)" },
    ],
  },
} satisfies Meta<typeof ChartDotLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoColumns: Story = {
  args: {
    className: "grid grid-flow-col grid-rows-2 gap-x-12",
    items: [
      { key: "ngn", label: "23,232 NGN", color: "var(--chart-2)" },
      { key: "usd", label: "9,235 USD", color: "var(--chart-3)" },
      { key: "eur", label: "12,326 EUR", color: "var(--chart-1)" },
      { key: "gbp", label: "11,458 GBP", color: "var(--destructive)" },
    ],
  },
};
