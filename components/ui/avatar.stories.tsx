import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { size: "default" },
  argTypes: { size: { control: "select", options: ["sm", "default", "lg"] } },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>AO</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const Large: Story = { args: { size: "lg" } };

export const WithBadge: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>AO</AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      {["AO", "TB", "MC"].map((initials) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
};
