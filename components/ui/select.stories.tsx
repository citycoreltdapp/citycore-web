import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
];

export const Default: Story = {
  render: () => (
    <Select items={fruits}>
      <SelectTrigger className="w-56" aria-label="Fruit">
        <SelectValue placeholder="Choose a fruit" />
      </SelectTrigger>
      <SelectContent>
        {fruits.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56" aria-label="Food">
        <SelectValue placeholder="Choose food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruit</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="spinach" disabled>
            Spinach
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const SmallTrigger: Story = {
  render: () => (
    <Select items={fruits} defaultValue="apple">
      <SelectTrigger size="sm" className="w-40" aria-label="Fruit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {fruits.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56" aria-label="Fruit">
        <SelectValue placeholder="Unavailable" />
      </SelectTrigger>
      <SelectContent />
    </Select>
  ),
};
