import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { OtpField } from "./otp-field";

const OtpFieldWithState = (args: React.ComponentProps<typeof OtpField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-[535px] max-w-full">
      <OtpField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/OtpField",
  component: OtpField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "otp-field", value: "", onChange: fn() },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    disabled: { control: "boolean" },
    length: { control: "number" },
  },
  render: (args) => <OtpFieldWithState {...args} />,
} satisfies Meta<typeof OtpField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartlyFilled: Story = { args: { value: "198" } };

export const WithError: Story = { args: { value: "198345", error: "Invalid OTP. Please enter a valid OTP." } };

export const WithLabelAndHelpText: Story = {
  args: { label: "Verification code", helpText: "Check your email for the code." },
};

export const FourDigits: Story = { args: { length: 4, value: "19" } };

export const Disabled: Story = { args: { value: "1983", disabled: true } };

export const WithMixins: Story = {
  args: {
    label: "Verification code",
    error: "Each part can be styled on its own",
    labelClassName: "text-primary",
    errorClassName: "font-medium",
  },
};

export const Masked: Story = { args: { value: "12", length: 4, mask: true, label: "4-digit transaction PIN" } };
