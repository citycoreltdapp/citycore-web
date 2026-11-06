"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { splitProps } from "@/lib/mixin";
import { SquareLock02Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PasswordFieldProps
  extends
    Omit<React.ComponentProps<typeof InputGroupInput>, "id" | "value" | "onChange" | "className" | "type">,
    FieldProps {
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
}

export function PasswordField({
  id,
  value,
  onChange,
  label,
  error,
  helpText,
  className,
  inputClassName,
  ...mixProps
}: PasswordFieldProps) {
  const { label: labelProps, error: errorProps, helpText: helpTextProps, rest } = splitProps(mixProps, ...fieldMixins);
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={SquareLock02Icon} />
        </InputGroupAddon>
        <InputGroupInput
          {...rest}
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            disabled={rest.disabled}
            onClick={() => setIsVisible(!isVisible)}
          >
            <HugeiconsIcon icon={isVisible ? ViewIcon : ViewOffSlashIcon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FieldShell>
  );
}
