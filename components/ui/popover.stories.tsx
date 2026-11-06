import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";

const meta = {
  title: "UI/Popover",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the size of this layer.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

export const AlignedEnd: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open on the right</PopoverTrigger>
      <PopoverContent align="end" side="right">
        <p className="text-sm">Positioned to the right.</p>
      </PopoverContent>
    </Popover>
  ),
};
