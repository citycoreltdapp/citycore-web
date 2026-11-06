import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Email address" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-2">
      <Label {...args} htmlFor="label-email" />
      <Input id="label-email" type="email" placeholder="name@example.com" />
    </div>
  ),
};
