import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { PasswordField } from "./password-field";

const PasswordFieldWithState = (args: React.ComponentProps<typeof PasswordField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-80">
      <PasswordField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/PasswordField",
  component: PasswordField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "password-field", value: "", onChange: fn(), label: "Password", placeholder: "Set your password" },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  render: (args) => <PasswordFieldWithState {...args} />,
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: "correct-horse" } };

export const WithError: Story = { args: { value: "short", error: "Password must be at least 8 characters" } };

export const WithHelpText: Story = { args: { helpText: "Use at least 8 characters." } };

export const Disabled: Story = { args: { value: "correct-horse", disabled: true } };

export const WithMixins: Story = {
  args: {
    helpText: "Mixins reach the label, help text, error and input.",
    error: "Each part can be styled on its own",
    labelClassName: "text-primary",
    helpTextClassName: "text-xs",
    errorClassName: "font-medium",
    inputClassName: "tracking-widest",
  },
};
