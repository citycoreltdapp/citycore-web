import * as React from "react";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { TextAreaField, TextField } from "./text-field";

const TextFieldWithState = (args: React.ComponentProps<typeof TextField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-80">
      <TextField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/TextField",
  component: TextField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "text-field", value: "", onChange: fn(), label: "Label", placeholder: "Placeholder…" },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  render: (args) => <TextFieldWithState {...args} />,
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialValue: Story = { args: { value: "Hello world" } };

export const WithIcon: Story = {
  args: { label: "Email", placeholder: "name@example.com", icon: <HugeiconsIcon icon={Mail01Icon} /> },
};

export const WithError: Story = { args: { error: "This field is required" } };

export const WithHelpText: Story = { args: { helpText: "Enter a value for this field." } };

export const Disabled: Story = { args: { value: "Disabled value", disabled: true } };

export const WithoutLabel: Story = { args: { label: undefined, "aria-label": "Search", placeholder: "Search…" } };

export const WithMixins: Story = {
  args: {
    helpText: "Mixins reach the label, help text, error and input.",
    error: "Each part can be styled on its own",
    labelClassName: "text-primary",
    helpTextClassName: "text-xs",
    errorClassName: "font-medium",
    inputClassName: "h-10",
  },
};

const TextAreaFieldWithState = (args: React.ComponentProps<typeof TextAreaField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-96">
      <TextAreaField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

export const TextArea: StoryObj<typeof TextAreaField> = {
  render: (args) => <TextAreaFieldWithState {...args} />,
  args: { id: "text-area", value: "", onChange: fn(), label: "Description", placeholder: "Describe…" },
};

export const TextAreaWithError: StoryObj<typeof TextAreaField> = {
  ...TextArea,
  args: { ...TextArea.args, error: "Please provide a description" },
};

export const TextAreaWithHelpText: StoryObj<typeof TextAreaField> = {
  ...TextArea,
  args: { ...TextArea.args, helpText: "Add a detailed description." },
};

export const TextAreaDisabled: StoryObj<typeof TextAreaField> = {
  ...TextArea,
  args: { ...TextArea.args, value: "Disabled content", disabled: true },
};
