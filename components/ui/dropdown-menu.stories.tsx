import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "UI/DropdownMenu",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem disabled>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

const WithChoices = () => {
  const [showGrid, setShowGrid] = React.useState(true);
  const [sort, setSort] = React.useState("newest");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>View options</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
          Show grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const CheckboxAndRadio: Story = { render: () => <WithChoices /> };

export const Submenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Share</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Email</DropdownMenuItem>
            <DropdownMenuItem>Message</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
