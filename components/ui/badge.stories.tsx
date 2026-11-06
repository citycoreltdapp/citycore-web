import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Badge" },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline", "ghost", "link"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };

export const Destructive: Story = { args: { variant: "destructive", children: "Failed" } };

export const Outline: Story = { args: { variant: "outline", children: "Outline" } };

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <HugeiconsIcon icon={Tick02Icon} /> Verified
      </>
    ),
  },
};
