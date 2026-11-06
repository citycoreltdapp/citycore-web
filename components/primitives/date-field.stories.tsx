import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { DateField } from "./date-field";

const DateFieldWithState = (args: React.ComponentProps<typeof DateField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="min-h-96 w-72">
      <DateField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/DateField",
  component: DateField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "date", value: "", onChange: fn(), label: "Date" },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  render: (args) => <DateFieldWithState {...args} />,
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: "2002-12-12" } };

export const CalendarOpen: Story = {
  args: { value: "2002-12-12", defaultOpen: true },
  parameters: { docs: { disable: true } },
};

export const DateOfBirth: Story = {
  args: { label: "Date Of Birth", disableFuture: true, reverseYears: true },
};

export const LimitedRange: Story = {
  args: {
    label: "Start date",
    helpText: "Only November 2026 can be picked.",
    minDate: new Date(2026, 10, 1),
    maxDate: new Date(2026, 10, 30),
  },
};

export const WithError: Story = { args: { error: "Date of birth is required" } };

export const Disabled: Story = { args: { value: "2002-12-12", disabled: true } };

export const WithMixins: Story = {
  args: {
    helpText: "Mixins reach the label, help text, error, trigger and calendar popup.",
    labelClassName: "text-primary",
    helpTextClassName: "text-xs",
    triggerClassName: "h-10",
  },
};
