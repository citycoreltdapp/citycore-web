import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProgressRing } from "./progress-ring";

const meta = {
  title: "Primitives/ProgressRing",
  component: ProgressRing,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: 35.5 },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } }, label: { control: "text" } },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

export const CustomLabel: Story = { args: { value: 80, label: "4/5" } };

export const WithMixins: Story = {
  args: {
    value: 60,
    className: "size-24",
    trackClassName: "stroke-muted",
    indicatorClassName: "stroke-chart-4",
  },
};
