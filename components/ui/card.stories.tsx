import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { className: "w-96" },
  argTypes: { size: { control: "select", options: ["default", "sm"] } },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Everything your team needs to ship.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Unlimited projects and shared workspaces.</p>
      </CardContent>
      <CardFooter>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Mark read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Your invoice is ready.</p>
      </CardContent>
    </Card>
  ),
};
