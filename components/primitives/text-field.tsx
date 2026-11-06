"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { splitProps } from "@/lib/mixin";

interface TextFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "className">, FieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Shown inside the input, before the text. */
  icon?: React.ReactNode;
  inputClassName?: string;
}

export function TextField({
  id,
  value,
  onChange,
  label,
  error,
  helpText,
  icon,
  className,
  inputClassName,
  ...mixProps
}: TextFieldProps) {
  const { label: labelProps, error: errorProps, helpText: helpTextProps, rest } = splitProps(mixProps, ...fieldMixins);

  const inputProps = {
    ...rest,
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    className: inputClassName,
    "aria-invalid": !!error,
    "aria-describedby": fieldDescribedBy(id, { error, helpText }),
  };

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      {icon ? (
        <InputGroup>
          <InputGroupAddon>{icon}</InputGroupAddon>
          <InputGroupInput {...inputProps} />
        </InputGroup>
      ) : (
        <Input {...inputProps} />
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps
  extends Omit<React.ComponentProps<typeof Textarea>, "id" | "value" | "onChange" | "className">, FieldProps {
  value: string;
  onChange: (value: string) => void;
  textareaClassName?: string;
}

export function TextAreaField({
  id,
  value,
  onChange,
  label,
  error,
  helpText,
  className,
  textareaClassName,
  ...mixProps
}: TextAreaFieldProps) {
  const { label: labelProps, error: errorProps, helpText: helpTextProps, rest } = splitProps(mixProps, ...fieldMixins);

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <Textarea
        {...rest}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={textareaClassName}
        aria-invalid={!!error}
        aria-describedby={fieldDescribedBy(id, { error, helpText })}
      />
    </FieldShell>
  );
}
