import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: TooltipContent,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Helpful hint", side: "top" },
  argTypes: { side: { control: "select", options: ["top", "right", "bottom", "left"] } },
  render: (args) => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
      <TooltipContent {...args} />
    </Tooltip>
  ),
} satisfies Meta<typeof TooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Right: Story = { args: { side: "right" } };

export const Bottom: Story = { args: { side: "bottom" } };
