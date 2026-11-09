import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { ResourceField, ResourceFieldItem } from "./resource-field";

interface Property {
  id: string;
  name: string;
  city: string;
}

const PROPERTIES: Property[] = [
  { id: "golden-estate", name: "Golden Estate", city: "Lagos" },
  { id: "silver-city", name: "Silver City", city: "Lagos" },
  { id: "palm-court", name: "Palm Court", city: "Abuja" },
  { id: "river-view", name: "River View", city: "Abuja" },
  { id: "garden-heights", name: "Garden Heights", city: "Port Harcourt" },
];

function Example({ grouped = false, error }: { grouped?: boolean; error?: string }) {
  const [value, setValue] = React.useState<Property | null>(null);
  return (
    <div className="w-96">
      <ResourceField
        id={React.useId()}
        label="Property"
        error={error}
        value={value}
        onChange={setValue}
        items={PROPERTIES}
        getItemKey={(item) => item.id}
        getItemTitle={(item) => item.name}
        getItemGroup={grouped ? (item) => item.city : undefined}
        searchFilter={(item, term) => `${item.name} ${item.city}`.toLowerCase().includes(term)}
        placeholder="Choose a property"
        searchPlaceholder="Search properties"
        renderSearchItem={(item, isSelected) => (
          <ResourceFieldItem selected={isSelected}>
            <span className="truncate">{item.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{item.city}</span>
          </ResourceFieldItem>
        )}
      />
    </div>
  );
}

const meta = {
  title: "Primitives/ResourceField",
  component: Example,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Grouped: Story = { args: { grouped: true } };

export const WithError: Story = { args: { error: "Choose a property" } };
