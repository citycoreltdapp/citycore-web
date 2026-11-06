import { Copy01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

const meta = {
  title: "UI/InputGroup",
  component: InputGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search" placeholder="Search…" />
    </InputGroup>
  ),
};

export const WithText: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput aria-label="Website" placeholder="example.com" />
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="API key" defaultValue="sk_test_123" readOnly />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Copy">
          <HugeiconsIcon icon={Copy01Icon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup>
      <InputGroupTextarea aria-label="Message" placeholder="Write a message…" />
      <InputGroupAddon align="block-end">
        <InputGroupText>0 / 280</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Email" aria-invalid defaultValue="not-an-email" />
    </InputGroup>
  ),
};
