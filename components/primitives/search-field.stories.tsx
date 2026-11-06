import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { fn } from "storybook/test";

import { SearchField } from "./search-field";

const SearchFieldWithState = (args: React.ComponentProps<typeof SearchField>) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="w-96">
      <SearchField {...args} id={React.useId()} value={value} onChange={setValue} />
    </div>
  );
};

const meta = {
  title: "Primitives/SearchField",
  component: SearchField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { id: "search-field", value: "", onChange: fn(), onSearch: (value) => toast(`Searching for "${value}"`) },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    helpText: { control: "text" },
    placeholder: { control: "text" },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => <SearchFieldWithState {...args} />,
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { value: "Payoneer" } };

export const FilterAsYouType: Story = { args: { onSearch: undefined, placeholder: "Filter results" } };

export const Loading: Story = { args: { value: "Payoneer", isLoading: true } };

export const WithLabel: Story = { args: { label: "Find a payment", helpText: "Search by ID or medium." } };

export const WithError: Story = { args: { value: "!!", error: "Enter at least 3 characters" } };

export const Disabled: Story = { args: { disabled: true } };

export const WithMixins: Story = {
  args: {
    groupClassName: "h-9 rounded-lg",
    buttonClassName: "rounded-md",
    inputClassName: "px-3",
    labelClassName: "text-primary",
    label: "Compact search",
  },
};
