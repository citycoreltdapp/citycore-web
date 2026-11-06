"use client";

import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

type ThemeToggleProps = Omit<React.ComponentProps<typeof Button>, "children" | "onClick">;

/** Switches between light and dark. CSS picks the icon, so the server and browser render the same thing. */
export function ThemeToggle(props: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      {...props}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <HugeiconsIcon icon={Moon02Icon} className="dark:hidden" />
      <HugeiconsIcon icon={Sun03Icon} className="hidden dark:block" />
    </Button>
  );
}
