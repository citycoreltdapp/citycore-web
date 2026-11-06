import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress, ProgressLabel, ProgressValue } from "./progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: 60, className: "w-80", "aria-label": "Progress" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Complete: Story = { args: { value: 100 } };

export const Indeterminate: Story = { args: { value: null } };

export const WithLabel: Story = {
  args: { "aria-label": undefined },
  render: (args) => (
    <Progress {...args}>
      <ProgressLabel>Uploading</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
};
