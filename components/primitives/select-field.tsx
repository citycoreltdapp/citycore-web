"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { type MixinProps, splitProps } from "@/lib/mixin";
import type { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";

export interface SelectFieldItem {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectFieldProps
  extends
    Omit<SelectPrimitive.Root.Props<string>, "id" | "value" | "onValueChange" | "items" | "children" | "multiple">,
    FieldProps,
    MixinProps<"trigger", Omit<React.ComponentProps<typeof SelectTrigger>, "children" | "id">>,
    MixinProps<"triggerValue", Omit<React.ComponentProps<typeof SelectValue>, "children" | "placeholder">>,
    MixinProps<"content", Omit<React.ComponentProps<typeof SelectContent>, "children">>,
    MixinProps<"item", Omit<React.ComponentProps<typeof SelectItem>, "children" | "value" | "disabled">> {
  value: string;
  onChange: (value: string) => void;
  /** Called when the user is done with the field: the list closes, or focus leaves while it's closed. */
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  items: SelectFieldItem[];
  isLoading?: boolean;
  placeholder?: string;
}

export function SelectField({
  id,
  value,
  onChange,
  onBlur,
  ref,
  items,
  label,
  error,
  helpText,
  className,
  isLoading = false,
  placeholder = "Select...",
  ...mixProps
}: SelectFieldProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    trigger: triggerProps,
    triggerValue: triggerValueProps,
    content: contentProps,
    item: itemProps,
    rest,
  } = splitProps(mixProps, ...fieldMixins, "trigger", "triggerValue", "content", "item");

  // Opening the list moves focus into it, which isn't the user leaving the field.
  const isOpenRef = React.useRef(false);

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <Select
        {...rest}
        items={items}
        value={value || null}
        onValueChange={(next) => onChange(next ?? "")}
        onOpenChange={(open, details) => {
          isOpenRef.current = open;
          rest.onOpenChange?.(open, details);
          if (!open) onBlur?.();
        }}
      >
        <SelectTrigger
          {...triggerProps}
          ref={ref}
          id={id}
          onBlur={() => {
            if (!isOpenRef.current) onBlur?.();
          }}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
          className={cn("w-full", triggerProps.className)}
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <SelectValue {...triggerValueProps} placeholder={placeholder}>
              {(selected: string | null) => {
                const item = items.find((i) => i.value === selected);
                return item ? (
                  <>
                    {item.icon}
                    {item.label}
                  </>
                ) : (
                  placeholder
                );
              }}
            </SelectValue>
          )}
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false} {...contentProps}>
          {items.map((item) => (
            <SelectItem {...itemProps} key={item.value} value={item.value} disabled={item.disabled}>
              {item.icon}
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
