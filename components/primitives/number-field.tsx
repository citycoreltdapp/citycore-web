"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { addCommas, caretPosition, isValidNumberText, parseNumberText, stripCommas } from "@/lib/number-input";

interface NumberFieldProps
  extends
    Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "type" | "className" | "prefix">,
    FieldProps,
    MixinProps<"group", React.ComponentProps<typeof InputGroup>> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowDecimal?: boolean;
  /** Shown before the number, such as a currency symbol. */
  prefix?: React.ReactNode;
  inputClassName?: string;
}

export function NumberField({
  id,
  value,
  onChange,
  label,
  error,
  helpText,
  className,
  inputClassName,
  allowDecimal = false,
  prefix,
  disabled,
  ref,
  ...mixProps
}: NumberFieldProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    group: groupProps,
    rest,
  } = splitProps(mixProps, ...fieldMixins, "group");

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Keep what was typed while it still means the same number, so "1." and "1.50" survive being controlled.
  const [draft, setDraft] = React.useState("");
  const raw = parseNumberText(draft) === value ? draft : value === undefined ? "" : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = stripCommas(e.target.value);
    if (!isValidNumberText(next, allowDecimal)) return;

    const typed = stripCommas(e.target.value.slice(0, e.target.selectionStart ?? 0)).length;

    setDraft(next);
    onChange(parseNumberText(next));

    requestAnimationFrame(() => {
      const caret = caretPosition(addCommas(next), typed);
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <InputGroup {...groupProps}>
        {prefix && (
          <InputGroupAddon>
            <InputGroupText>{prefix}</InputGroupText>
          </InputGroupAddon>
        )}
        <InputGroupInput
          {...rest}
          ref={inputRef}
          id={id}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          value={addCommas(raw)}
          disabled={disabled}
          onChange={handleChange}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error, helpText })}
        />
      </InputGroup>
    </FieldShell>
  );
}
