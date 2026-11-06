"use client";

import type * as React from "react";

import { AppModalProvider } from "@/components/primitives/app-modal";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

export function Providers({ children, forcedTheme }: { children: React.ReactNode; forcedTheme?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      <TooltipProvider>
        <AppModalProvider>
          {children}
          <Toaster position="bottom-right" />
        </AppModalProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
