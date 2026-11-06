import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { "aria-label": "Plan", defaultValue: "pro" },
  argTypes: { disabled: { control: "boolean" } },
  render: (args) => (
    <RadioGroup {...args}>
      {["Free", "Pro", "Team"].map((plan) => (
        <Label key={plan}>
          <RadioGroupItem value={plan.toLowerCase()} /> {plan}
        </Label>
      ))}
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
