import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { defaultValue: "account", className: "w-96" },
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="team" disabled>
          Team
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account.</TabsContent>
      <TabsContent value="billing">Manage your billing.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = { args: { orientation: "vertical" } };

export const LineVariant: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="line">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account.</TabsContent>
      <TabsContent value="billing">Manage your billing.</TabsContent>
    </Tabs>
  ),
};
