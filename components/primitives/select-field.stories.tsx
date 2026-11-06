import * as React from "react";

import { CallIcon, Globe02Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SelectField } from "./select-field";

const defaultItems = [
  { value: "option-a", label: "Option A" },
  { value: "option-b", label: "Option B" },
  { value: "option-c", label: "Option C" },
];

const SelectFieldWithState = (args: React.ComponentProps<typeof SelectField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-80">
      <SelectField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/SelectField",
  component: SelectField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    id: "select-field",
    value: "",
    onChange: fn(),
    items: defaultItems,
    label: "Choose an option",
    placeholder: "Select…",
  },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    placeholder: { control: "text" },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => <SelectFieldWithState {...args} />,
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialValue: Story = { args: { value: "option-b" } };

export const WithError: Story = { args: { error: "Please select an option" } };

export const WithHelpText: Story = { args: { helpText: "You can change this later." } };

export const Loading: Story = { args: { isLoading: true } };

export const Disabled: Story = { args: { value: "option-a", disabled: true } };

export const WithDisabledItem: Story = {
  args: {
    items: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "team", label: "Team (coming soon)", disabled: true },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    label: "Contact method",
    value: "email",
    items: [
      { value: "email", label: "Email", icon: <HugeiconsIcon icon={Mail01Icon} /> },
      { value: "phone", label: "Phone", icon: <HugeiconsIcon icon={CallIcon} /> },
      { value: "web", label: "Website", icon: <HugeiconsIcon icon={Globe02Icon} /> },
    ],
  },
};

export const WithMixins: Story = {
  args: {
    value: "option-a",
    labelClassName: "text-primary",
    triggerClassName: "h-10 font-medium",
    triggerValueClassName: "text-primary",
    contentClassName: "ring-primary",
    itemClassName: "font-medium",
  },
};

export const OpensAbove: Story = { args: { contentSide: "top" } };

export const CoversTrigger: Story = { args: { value: "option-b", contentAlignItemWithTrigger: true } };
