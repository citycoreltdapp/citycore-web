import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "Placeholder…", "aria-label": "Example", className: "w-80" },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number", "file"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "Hello world" } };

export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "Not valid" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "Disabled" } };

export const File: Story = { args: { type: "file" } };
