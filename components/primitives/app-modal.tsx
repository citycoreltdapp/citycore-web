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
  content?: React.ReactNode;
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

// One base modal, plus modals pushed on top of it (such as a picker opened from inside a form modal).
let setConfig: React.Dispatch<React.SetStateAction<AppModalOptions | null>> | null = null;
let setStack: React.Dispatch<React.SetStateAction<AppModalOptions[]>> | null = null;
let hasBase = false;

/** Open a modal from anywhere: AppModal.open({ title, content }). Requires AppModalProvider. */
export const AppModal = {
  open: (options: AppModalOptions) => {
    setStack?.([]);
    setConfig?.(options);
  },
  /** Closes every open modal, stacked ones included. */
  close: () => {
    setStack?.([]);
    setConfig?.(null);
  },
  /** Opens a modal on top of the current one, which stays open underneath. With nothing open it acts like open. */
  push: (options: AppModalOptions) => (hasBase ? setStack?.((stack) => [...stack, options]) : setConfig?.(options)),
  /** Closes only the top modal. */
  pop: () => {
    let popped = false;
    setStack?.((stack) => {
      popped = stack.length > 0;
      return stack.slice(0, -1);
    });
    queueMicrotask(() => {
      if (!popped) setConfig?.(null);
    });
  },
  /** A short confirm or cancel dialog. The confirm button closes the modal after it runs. */
  confirm: ({
    title,
    description,
    confirmLabel,
    onConfirm,
  }: {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }) =>
    setConfig?.({
      title,
      description,
      size: "small",
      secondaryButton: { children: "Cancel" },
      primaryButton: { children: confirmLabel, variant: "destructive", onClick: onConfirm },
    }),
  updateConfig: (partial: Partial<AppModalOptions>) =>
    setConfig?.((current) => (current ? { ...current, ...partial } : current)),
};

const SIZES = {
  small: "sm:max-w-md",
  medium: "sm:max-w-2xl",
  full: "inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none ring-0 sm:max-w-none",
};

/** The dialog body for one modal. Stacked modals render inside their parent so focus and dismissal nest. */
function ModalFrame({
  config,
  onClose,
  children,
}: {
  config: AppModalOptions;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const size = config.size ?? "medium";
  const { primaryButton, secondaryButton } = config;
  return (
    <DialogContent
      showCloseButton={config.showCloseButton ?? true}
      className={cn("flex max-h-dvh flex-col gap-0 overflow-hidden p-0", SIZES[size])}
    >
      <DialogHeader className="shrink-0 border-b p-6">
        <DialogTitle className="text-xl font-semibold">{config.title}</DialogTitle>
        {config.description && <DialogDescription>{config.description}</DialogDescription>}
      </DialogHeader>

      {config.content != null && (
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
      )}

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
                    onClose();
                  }}
                />
              )}
              {primaryButton && (
                <Button
                  {...primaryButton}
                  onClick={(e) => {
                    primaryButton.onClick?.(e);
                    onClose();
                  }}
                />
              )}
            </>
          )}
        </DialogFooter>
      )}
      {children}
    </DialogContent>
  );
}

function StackedModals({ stack, index }: { stack: AppModalOptions[]; index: number }) {
  const config = stack[index];
  if (!config) return null;
  const close = () => {
    config.onClose?.();
    setStack?.((current) => current.slice(0, index));
  };
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <ModalFrame config={config} onClose={close}>
        <StackedModals stack={stack} index={index + 1} />
      </ModalFrame>
    </Dialog>
  );
}

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [config, setState] = React.useState<AppModalOptions | null>(null);
  const [stack, setStackState] = React.useState<AppModalOptions[]>([]);

  React.useEffect(() => {
    setConfig = setState;
    setStack = setStackState;
    return () => {
      setConfig = null;
      setStack = null;
    };
  }, []);

  React.useEffect(() => {
    hasBase = !!config;
  }, [config]);

  const close = () => {
    config?.onClose?.();
    // Stacked modals belong to the base one, so they go when it does.
    setStackState([]);
    setState(null);
  };

  return (
    <>
      {children}
      <Dialog open={!!config} onOpenChange={(open) => !open && close()}>
        {config && (
          <ModalFrame config={config} onClose={close}>
            <StackedModals stack={stack} index={0} />
          </ModalFrame>
        )}
      </Dialog>
    </>
  );
}
