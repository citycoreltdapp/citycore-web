import * as React from "react";

import { Label } from "@/components/ui/label";
import type { MixinProps } from "@/lib/mixin";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type LabelProps = Omit<React.ComponentProps<typeof Label>, "children" | "htmlFor">;
type TextProps = Omit<React.ComponentProps<"p">, "children" | "id">;

/** The label, error and help text every field shares, with mixins to reach each one. */
export interface FieldProps
  extends MixinProps<"label", LabelProps>, MixinProps<"error", TextProps>, MixinProps<"helpText", TextProps> {
  id: string;
  label?: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  /** Goes on the field's wrapper. Use the mixin for the control, such as inputClassName. */
  className?: string;
}

export const fieldMixins = ["label", "error", "helpText"] as const;

/** Links a control to its error and help text for screen readers. */
export const fieldDescribedBy = (id: string, { error, helpText }: Pick<FieldProps, "error" | "helpText">) =>
  [helpText && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

interface FieldShellProps extends Pick<FieldProps, "id" | "label" | "error" | "helpText" | "className"> {
  labelProps: LabelProps;
  errorProps: TextProps;
  helpTextProps: TextProps;
  children: React.ReactNode;
}

/** An error message with its icon, for controls that don't use FieldShell. */
export function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p role="alert" className={cn("flex items-center gap-1.5 text-sm text-destructive", className)} {...props}>
      <HugeiconsIcon icon={AlertCircleIcon} aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  );
}

export function FieldShell({
  id,
  label,
  error,
  helpText,
  className,
  labelProps,
  errorProps,
  helpTextProps,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
      )}

      {helpText && (
        <p
          {...helpTextProps}
          id={`${id}-help`}
          className={cn("text-sm text-muted-foreground", helpTextProps.className)}
        >
          {helpText}
        </p>
      )}

      {children}

      {error && (
        <FieldError {...errorProps} id={`${id}-error`}>
          {error}
        </FieldError>
      )}
    </div>
  );
}
