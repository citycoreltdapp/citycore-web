import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";

import { Button } from "./button";

// The Toaster itself is mounted by Providers, in the app and in every story.
const meta = {
  title: "UI/Toast",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Event created")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Saved")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Couldn't save")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Almost out of seats")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info("New version available")}>
        Info
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast("Invite sent", { description: "They'll get an email with a link." })}
    >
      Show toast
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast("Item removed", { action: { label: "Undo", onClick: () => toast("Restored") } })}
    >
      Show toast
    </Button>
  ),
};
