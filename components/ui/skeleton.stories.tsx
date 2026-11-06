import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { className: "h-4 w-48" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CardLoading: Story = {
  render: () => (
    <div className="flex w-64 items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  ),
};
