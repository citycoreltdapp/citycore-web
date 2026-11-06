import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stepper } from "./stepper";

const STEPS = [
  { title: "Personal Info", description: "Tell Us About Yourself" },
  { title: "Identity Verification", description: "Verify Your Identity" },
  { title: "Review & Submit", description: "Confirm Your Information" },
];

const meta = {
  title: "Primitives/Stepper",
  component: Stepper,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { steps: STEPS, currentStep: 0, className: "w-[625px] max-w-full" },
  argTypes: { currentStep: { control: { type: "number", min: 0, max: 3 } } },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {};

export const MiddleStep: Story = { args: { currentStep: 1 } };

export const LastStep: Story = { args: { currentStep: 2 } };

export const AllDone: Story = { args: { currentStep: 3 } };

export const TitlesOnly: Story = {
  args: { currentStep: 1, steps: STEPS.map(({ title }) => ({ title })) },
};

export const WithMixins: Story = { args: { currentStep: 1, itemClassName: "py-5" } };
