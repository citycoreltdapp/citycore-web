import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "./label";
import { Switch } from "./switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { "aria-label": "Example" },
  argTypes: {
    disabled: { control: "boolean" },
    size: { control: "select", options: ["default", "sm"] },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Small: Story = { args: { size: "sm", defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: () => (
    <Label>
      <Switch defaultChecked /> Email notifications
    </Label>
  ),
};
