import type { Meta, StoryObj } from "@storybook/react-vite";

import { Sparkline } from "./sparkline";

const meta = {
  title: "Primitives/Sparkline",
  component: Sparkline,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { data: [30, 55, 50, 85, 45, 60, 35, 55, 30, 62] },
  argTypes: {
    color: { control: "text" },
    fillColor: { control: "text" },
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomColors: Story = { args: { color: "var(--chart-2)", fillColor: "var(--chart-2)" } };

export const Large: Story = { args: { className: "h-24 w-64" } };

export const FlatData: Story = { args: { data: [50, 50, 50, 50, 50] } };
