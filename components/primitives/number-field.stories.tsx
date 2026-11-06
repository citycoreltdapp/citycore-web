import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { NumberField } from "./number-field";

const NumberFieldWithState = (args: React.ComponentProps<typeof NumberField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-80">
      <NumberField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/NumberField",
  component: NumberField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "number-field", value: undefined, onChange: fn(), label: "Amount", placeholder: "0" },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    allowDecimal: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => <NumberFieldWithState {...args} />,
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPrefix: Story = { args: { value: 250000, prefix: "₦" } };

export const WithInitialValue: Story = { args: { value: 1250000 } };

export const AllowDecimal: Story = { args: { allowDecimal: true, helpText: "Try typing 1234.5" } };

export const WithError: Story = { args: { value: 0, error: "Amount must be greater than 0" } };

export const Disabled: Story = { args: { value: 500, disabled: true } };

export const WithMixins: Story = {
  args: { value: 1000, labelClassName: "text-primary", inputClassName: "font-mono" },
};

export const LargeAmount: Story = {
  args: {
    value: 100000,
    prefix: "₦",
    groupClassName: "h-18 rounded-xl",
    inputClassName: "h-full text-4xl font-light tabular-nums md:text-4xl",
  },
};
