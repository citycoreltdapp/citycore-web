import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Primitives/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Storybook's toolbar controls the theme here, so use it to see the other icon. Clicking works in the app.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ghost: Story = { args: { variant: "ghost" } };

export const Disabled: Story = { args: { disabled: true } };
