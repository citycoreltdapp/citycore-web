"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { splitProps } from "@/lib/mixin";
import { cn } from "cn";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface OtpFieldProps extends FieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  /** How many digits the code has. */
  length?: number;
  /** Hides the digits, and stops the browser and password managers offering to fill it. For secrets like a PIN. */
  mask?: boolean;
  slotClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

/** One-time code boxes. Accepts digits only, and a pasted or autofilled code fills every box. */
export function OtpField({
  id,
  value,
  onChange,
  onBlur,
  name,
  disabled,
  length = 6,
  mask = false,
  slotClassName,
  ref,
  label,
  error,
  helpText,
  className,
  ...mixProps
}: OtpFieldProps) {
  const { label: labelProps, error: errorProps, helpText: helpTextProps } = splitProps(mixProps, ...fieldMixins);

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <InputOTP
        ref={ref}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={length}
        pattern={REGEXP_ONLY_DIGITS}
        containerClassName="w-full"
        aria-invalid={!!error}
        aria-describedby={fieldDescribedBy(id, { error, helpText })}
        {...(mask && { type: "password", autoComplete: "off", pushPasswordManagerStrategy: "none" as const })}
      >
        <InputOTPGroup className="w-full justify-between gap-2 has-aria-invalid:ring-0 dark:has-aria-invalid:ring-0">
          {Array.from({ length }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              mask={mask}
              aria-invalid={!!error}
              className={cn(
                "size-11 rounded-[10px] border text-base first:rounded-[10px] last:rounded-[10px] data-[active=true]:ring-0 data-[active=true]:aria-invalid:ring-0 sm:size-13.5",
                slotClassName
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </FieldShell>
  );
}
