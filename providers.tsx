"use client";

import * as React from "react";

import { AppModalProvider } from "@/components/primitives/app-modal";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastViewportHost } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export function Providers({ children, forcedTheme }: { children: React.ReactNode; forcedTheme?: string }) {
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
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
            <ToastViewportHost />
          </AppModalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
