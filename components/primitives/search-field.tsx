"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

interface SearchFieldProps
  extends
    Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "type" | "className">,
    FieldProps,
    MixinProps<"group", React.ComponentProps<typeof InputGroup>>,
    MixinProps<"button", Omit<React.ComponentProps<typeof InputGroupButton>, "children" | "onClick" | "type">> {
  value: string;
  onChange: (value: string) => void;
  /** Adds the search button, and also runs on Enter. Leave it out to filter as the user types. */
  onSearch?: (value: string) => void;
  isLoading?: boolean;
  inputClassName?: string;
}

export function SearchField({
  id,
  value,
  onChange,
  onSearch,
  isLoading = false,
  label,
  error,
  helpText,
  className,
  inputClassName,
  placeholder = "Search",
  onKeyDown,
  ...mixProps
}: SearchFieldProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    group: groupProps,
    button: buttonProps,
    rest,
  } = splitProps(mixProps, ...fieldMixins, "group", "button");

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <InputGroup {...groupProps} className={cn("h-11 rounded-full bg-muted/50", groupProps.className)}>
        <InputGroupInput
          aria-label={label ? undefined : "Search"}
          {...rest}
          id={id}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.key === "Enter") onSearch?.(value);
          }}
          className={cn("px-4 [&::-webkit-search-cancel-button]:appearance-none", inputClassName)}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
        />
        <InputGroupAddon align="inline-end" className="pr-1.5">
          {onSearch ? (
            <InputGroupButton
              variant="default"
              size="icon-sm"
              aria-label="Search"
              isLoading={isLoading}
              {...buttonProps}
              className={cn("rounded-full", buttonProps.className)}
              onClick={() => onSearch(value)}
            >
              {!isLoading && <HugeiconsIcon icon={Search01Icon} />}
            </InputGroupButton>
          ) : (
            <span className="flex size-8 items-center justify-center">
              {isLoading ? <Spinner /> : <HugeiconsIcon icon={Search01Icon} className="size-4" />}
            </span>
          )}
        </InputGroupAddon>
      </InputGroup>
    </FieldShell>
  );
}
