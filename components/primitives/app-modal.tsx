"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "cn";

type ModalButtonProps = React.ComponentProps<typeof Button>;

export interface AppModalOptions {
  title: string;
  description?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  /** Closes the modal after its onClick runs. Use `footer` for buttons that keep it open, such as async saves. */
  primaryButton?: ModalButtonProps;
  secondaryButton?: ModalButtonProps;
  size?: "small" | "medium" | "full";
  showCloseButton?: boolean;
  onClose?: () => void;
  /** Change this when swapping content with updateConfig to play the step transition. */
  stepKey?: string | number;
  stepDirection?: "forward" | "backward";
}

// ponytail: one modal at a time through a module-level setter; add a stack when modals need to open modals.
let setConfig: React.Dispatch<React.SetStateAction<AppModalOptions | null>> | null = null;

/** Open a modal from anywhere: AppModal.open({ title, content }). Requires AppModalProvider. */
export const AppModal = {
  open: (options: AppModalOptions) => setConfig?.(options),
  close: () => setConfig?.(null),
  updateConfig: (partial: Partial<AppModalOptions>) =>
    setConfig?.((current) => (current ? { ...current, ...partial } : current)),
};

const SIZES = {
  small: "sm:max-w-md",
  medium: "sm:max-w-2xl",
  full: "inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none ring-0 sm:max-w-none",
};

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [config, setState] = React.useState<AppModalOptions | null>(null);

  React.useEffect(() => {
    setConfig = setState;
    return () => {
      setConfig = null;
    };
  }, []);

  const close = () => {
    config?.onClose?.();
    setState(null);
  };

  const size = config?.size ?? "medium";
  const { primaryButton, secondaryButton } = config ?? {};

  return (
    <>
      {children}
      <Dialog open={!!config} onOpenChange={(open) => !open && close()}>
        {config && (
          <DialogContent
            showCloseButton={config.showCloseButton ?? true}
            className={cn("flex max-h-dvh flex-col gap-0 overflow-hidden p-0", SIZES[size])}
          >
            <DialogHeader className="shrink-0 border-b p-6">
              <DialogTitle className="text-xl font-semibold">{config.title}</DialogTitle>
              {config.description && <DialogDescription>{config.description}</DialogDescription>}
            </DialogHeader>

            <div
              key={config.stepKey ?? "content"}
              className={cn(
                "min-h-0 flex-1 overflow-y-auto p-6",
                config.stepKey !== undefined && "animate-in fade-in",
                config.stepKey !== undefined &&
                  (config.stepDirection === "backward" ? "slide-in-from-left-4" : "slide-in-from-right-4")
              )}
            >
              {config.content}
            </div>

            {(config.footer || primaryButton || secondaryButton) && (
              <DialogFooter className="m-0 shrink-0 rounded-none px-6 py-4">
                {config.footer ?? (
                  <>
                    {secondaryButton && (
                      <Button
                        variant="outline"
                        {...secondaryButton}
                        onClick={(e) => {
                          secondaryButton.onClick?.(e);
                          close();
                        }}
                      />
                    )}
                    {primaryButton && (
                      <Button
                        {...primaryButton}
                        onClick={(e) => {
                          primaryButton.onClick?.(e);
                          close();
                        }}
                      />
                    )}
                  </>
                )}
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
