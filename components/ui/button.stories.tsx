import { Add01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Button" },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "outline", "ghost", "destructive", "link"] },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };

export const Outline: Story = { args: { variant: "outline", children: "Outline" } };

export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };

export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };

export const Link: Story = { args: { variant: "link", children: "Learn more" } };

export const Small: Story = { args: { size: "sm", children: "Small" } };

export const Large: Story = { args: { size: "lg", children: "Large" } };

export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };

export const Loading: Story = { args: { isLoading: true, children: "Saving" } };

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <HugeiconsIcon icon={Mail01Icon} /> Send email
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: { size: "icon", "aria-label": "Add", children: <HugeiconsIcon icon={Add01Icon} /> },
};
