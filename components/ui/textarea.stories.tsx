import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "Write something…", "aria-label": "Example", className: "w-80" },
  argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "Some longer text content." } };

export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "Not valid" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "Disabled" } };
