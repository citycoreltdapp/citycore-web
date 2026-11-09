import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { BankSelectField, findBank } from "./bank-select-field";

const BankSelectFieldWithState = (args: React.ComponentProps<typeof BankSelectField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-96">
      <BankSelectField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/BankSelectField",
  component: BankSelectField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "bank-select", value: null, onChange: fn() },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
  },
  render: (args) => <BankSelectFieldWithState {...args} />,
} satisfies Meta<typeof BankSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { value: findBank({ code: "058" }) ?? null } };

export const WithError: Story = { args: { error: "Choose your bank" } };
