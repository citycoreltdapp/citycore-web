import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DonutChart } from "./donut-chart";

const balances = [
  { key: "ngn", label: "NGN", value: 23232, color: "var(--chart-2)" },
  { key: "usd", label: "USD", value: 9235, color: "var(--chart-3)" },
  { key: "eur", label: "EUR", value: 12326, color: "var(--chart-1)" },
  { key: "gbp", label: "GBP", value: 11458, color: "var(--destructive)" },
];

const meta = {
  title: "Primitives/DonutChart",
  component: DonutChart,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    data: balances,
    centerValue: "56,251",
    centerLabel: "Total Balance",
    legendClassName: "grid grid-flow-col grid-rows-2 gap-x-12",
  },
  argTypes: {
    centerLabel: { control: "text" },
    showLegend: { control: "boolean" },
    showTooltip: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCenter: Story = { args: { centerValue: undefined, centerLabel: undefined } };

export const WithoutLegend: Story = { args: { showLegend: false } };

export const ThickRing: Story = { args: { pieInnerRadius: "70%", pieCornerRadius: 8 } };

// Slice sizes are set to match the design; displayValue carries the figures it shows.
export const AccountBalance: Story = {
  decorators: [
    (Story) => (
      <Card className="w-110 gap-0 rounded-xl py-0 shadow-sm ring-0">
        <CardHeader className="mx-7 mt-7 flex items-center justify-between border-b border-dashed px-0 py-0 pb-5">
          <CardTitle className="text-2xl font-semibold">Account Balance</CardTitle>
          <Button variant="ghost" size="icon-sm" aria-label="More options">
            <HugeiconsIcon icon={MoreHorizontalIcon} />
          </Button>
        </CardHeader>
        <CardContent className="px-7 py-7">
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  args: {
    data: [
      { key: "ngn", label: "NGN", value: 52, displayValue: "23,232", color: "var(--chart-2)" },
      { key: "usd", label: "USD", value: 10, displayValue: "9,235", color: "var(--chart-3)" },
      { key: "eur", label: "EUR", value: 20, displayValue: "12,326", color: "var(--chart-1)" },
      { key: "gbp", label: "GBP", value: 18, displayValue: "11,458", color: "oklch(0.69 0.17 24)" },
    ],
    centerValue: "99,800.35",
    centerLabel: "Total Balance",
    legendClassName: "grid grid-flow-col grid-rows-2 justify-center gap-x-16 gap-y-4 text-base",
  },
};
