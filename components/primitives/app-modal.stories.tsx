import { Button } from "@/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";

import { AppModal } from "./app-modal";

const meta = {
  title: "Primitives/AppModal",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export const Small: Story = {
  render: () => (
    <Button
      onClick={() =>
        AppModal.open({
          title: "Small modal",
          description: "A compact dialog for confirmations or short forms.",
          size: "small",
          content: <p className="text-muted-foreground">{lorem}</p>,
          secondaryButton: { children: "Cancel" },
          primaryButton: { children: "Confirm", onClick: () => toast.success("Confirmed") },
        })
      }
    >
      Open small modal
    </Button>
  ),
};

export const Medium: Story = {
  render: () => (
    <Button
      onClick={() =>
        AppModal.open({
          title: "Medium modal",
          description: "For forms or content that need more width.",
          size: "medium",
          content: <p className="text-muted-foreground">{lorem}</p>,
          primaryButton: { children: "Done" },
        })
      }
    >
      Open medium modal
    </Button>
  ),
};

export const Full: Story = {
  render: () => (
    <Button
      onClick={() =>
        AppModal.open({
          title: "Full-screen modal",
          description: "For long flows that need the whole screen.",
          size: "full",
          content: <p className="text-muted-foreground">{lorem}</p>,
          secondaryButton: { children: "Close" },
        })
      }
    >
      Open full-screen modal
    </Button>
  ),
};

export const WithSteps: Story = {
  render: () => (
    <Button
      onClick={() =>
        AppModal.open({
          title: "Step one",
          size: "small",
          stepKey: 1,
          content: (
            <Button
              onClick={() =>
                AppModal.updateConfig({
                  title: "Step two",
                  stepKey: 2,
                  content: <p>Swapped with updateConfig, so the modal stays open.</p>,
                })
              }
            >
              Next step
            </Button>
          ),
        })
      }
    >
      Open stepped modal
    </Button>
  ),
};

export const CustomFooter: Story = {
  render: () => (
    <Button
      onClick={() =>
        AppModal.open({
          title: "Custom footer",
          description: "Use `footer` for buttons that shouldn't close the modal.",
          size: "small",
          content: <p className="text-muted-foreground">{lorem}</p>,
          footer: (
            <>
              <Button variant="outline" onClick={() => toast("Draft saved")}>
                Save draft
              </Button>
              <Button onClick={() => AppModal.close()}>Close</Button>
            </>
          ),
        })
      }
    >
      Open with custom footer
    </Button>
  ),
};
