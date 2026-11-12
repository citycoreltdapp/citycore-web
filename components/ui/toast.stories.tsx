import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { ToastCard, type ToastType, toast } from "./toast";

// The Toaster is mounted by Providers, in the app and in every story; these buttons add to it.
const meta = {
  title: "UI/Toast",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLES: { type: ToastType; title: string; description?: string }[] = [
  { type: "info", title: "Statement ready", description: "Your October statement is in Documents." },
  { type: "success", title: "Signed in", description: "Welcome back to City Core." },
  { type: "warning", title: "KYC pending", description: "Finish verifying to start investing." },
  { type: "error", title: "Incorrect email or password", description: "Check your details and try again." },
  { type: "loading", title: "Saving your changes" },
  { type: "copy", title: "Link copied" },
];

/** Every type as a static card, for checking colours in both themes. */
export const Types: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      {SAMPLES.map((sample) => (
        <ToastCard key={sample.type} {...sample} onClose={() => undefined} />
      ))}
    </div>
  ),
};

export const Live: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SAMPLES.map(({ type, title, description }) => (
        <Button key={type} variant="outline" onClick={() => toast.add({ type, title, description })}>
          {type[0].toUpperCase() + type.slice(1)}
        </Button>
      ))}
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.add({
          type: "info",
          title: "Withdrawal cancelled",
          description: "₦50,000 went back to your wallet.",
          actionProps: {
            children: "Undo",
            onClick: () => toast.add({ type: "success", title: "Withdrawal restored" }),
          },
        })
      }
    >
      Show toast
    </Button>
  ),
};

/** A loading toast that turns into success or error when the work finishes. */
export const Promise: Story = {
  render: () => (
    <div className="flex gap-2">
      {[true, false].map((succeeds) => (
        <Button
          key={String(succeeds)}
          variant="outline"
          onClick={() =>
            toast.promise(new globalThis.Promise((resolve, reject) => setTimeout(succeeds ? resolve : reject, 1500)), {
              loading: { type: "loading", title: "Sending code" },
              success: { type: "success", title: "Code sent", description: "Check your inbox." },
              error: { type: "error", title: "Couldn't send the code", description: "Try again in a minute." },
            })
          }
        >
          {succeeds ? "Succeeds" : "Fails"}
        </Button>
      ))}
    </div>
  ),
};
