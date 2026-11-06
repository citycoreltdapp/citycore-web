import * as React from "react";

import { Switch } from "@/components/ui/switch";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { EmbeddedFieldRow, FieldStack } from "./field-stack";
import { NumberField } from "./number-field";
import { TextField } from "./text-field";

const meta = {
  title: "Primitives/FieldStack",
  component: FieldStack,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof FieldStack>;

export default meta;
type Story = StoryObj<typeof meta>;

const Stacked = () => {
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  return (
    <FieldStack className="w-80 gap-4">
      <TextField id="first-name" label="First name" value={first} onChange={setFirst} />
      <TextField id="last-name" label="Last name" value={last} onChange={setLast} />
    </FieldStack>
  );
};

export const Default: Story = { render: () => <Stacked /> };

const WithFollowUp = ({ layout }: { layout: "inline" | "stack" }) => {
  const [limited, setLimited] = React.useState(true);
  const [limit, setLimit] = React.useState<number | undefined>(50);
  return (
    <FieldStack className="w-80">
      <div className="flex items-center gap-2">
        <Switch id={`limited-${layout}`} checked={limited} onCheckedChange={setLimited} />
        <label htmlFor={`limited-${layout}`} className="text-sm">
          Limit seats
        </label>
      </div>
      <EmbeddedFieldRow when={limited} layout={layout}>
        <EmbeddedFieldRow.Label>Up to</EmbeddedFieldRow.Label>
        <NumberField id={`limit-${layout}`} aria-label="Seat limit" value={limit} onChange={setLimit} />
        <EmbeddedFieldRow.Suffix>seats</EmbeddedFieldRow.Suffix>
      </EmbeddedFieldRow>
    </FieldStack>
  );
};

export const EmbeddedInline: Story = { render: () => <WithFollowUp layout="inline" /> };

export const EmbeddedStacked: Story = { render: () => <WithFollowUp layout="stack" /> };
