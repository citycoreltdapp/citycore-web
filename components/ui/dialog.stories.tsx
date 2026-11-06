import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "UI/Dialog",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button variant="destructive" />}>Delete</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithFooterCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Update available</DialogTitle>
          <DialogDescription>Restart to install the latest version.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
};
