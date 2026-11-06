import * as React from "react";

import { EMPTY_PHONE_NUMBER } from "@/lib/phone-number";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { PhoneNumberField } from "./phone-number-field";

const PhoneNumberFieldWithState = (args: React.ComponentProps<typeof PhoneNumberField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="min-h-96 w-96">
      <PhoneNumberField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/PhoneNumberField",
  component: PhoneNumberField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "phone-number", value: EMPTY_PHONE_NUMBER, onChange: fn(), label: "Phone Number" },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    disabled: { control: "boolean" },
  },
  render: (args) => <PhoneNumberFieldWithState {...args} />,
} satisfies Meta<typeof PhoneNumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: { number: "0802 345 6789", countryCode: "NG" } } };

export const OtherCountry: Story = { args: { value: { number: "(201) 555-0123", countryCode: "US" } } };

export const WithError: Story = {
  args: { value: { number: "0802", countryCode: "NG" }, error: "Enter a valid phone number" },
};

export const WithHelpText: Story = { args: { helpText: "We'll text a code to this number." } };

export const Disabled: Story = { args: { value: { number: "0802 345 6789", countryCode: "NG" }, disabled: true } };

export const CountryListOpen: Story = { args: { defaultOpen: true }, parameters: { docs: { disable: true } } };

export const WithMixins: Story = {
  args: {
    helpText: "Mixins reach the label, help text, error, group, input and popup.",
    labelClassName: "text-primary",
    helpTextClassName: "text-xs",
    groupClassName: "h-10",
    inputPlaceholder: "Your number",
  },
};
