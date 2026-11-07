"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { format, isValid, parseISO } from "date-fns";

const VALUE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";
const DEFAULT_MIN_DATE = new Date(1900, 0, 1);
const DEFAULT_MAX_DATE = new Date(2100, 11, 31);

/** Its own component so today's date is only read once the calendar opens, in the browser. */
function DateCalendar({
  selected,
  minDate,
  maxDate,
  disableFuture,
  reverseYears,
  onSelect,
}: {
  selected?: Date;
  minDate: Date;
  maxDate: Date;
  disableFuture?: boolean;
  reverseYears?: boolean;
  onSelect: (date: Date | undefined) => void;
}) {
  const latest = disableFuture ? new Date() : maxDate;

  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      selected={selected}
      onSelect={onSelect}
      defaultMonth={selected ?? new Date()}
      startMonth={minDate}
      endMonth={latest}
      reverseYears={reverseYears}
      disabled={{ before: minDate, after: latest }}
    />
  );
}

interface DateFieldProps
  extends
    FieldProps,
    MixinProps<"trigger", Pick<React.ComponentProps<typeof Button>, "className">>,
    MixinProps<"content", Pick<React.ComponentProps<typeof PopoverContent>, "className">> {
  /** The date as "yyyy-MM-dd", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the user is done with the field: the calendar closes, or focus leaves while it's closed. */
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Earliest date that can be picked. Also the first year in the dropdown. */
  minDate?: Date;
  /** Latest date that can be picked. Also the last year in the dropdown. */
  maxDate?: Date;
  /** Nothing after today can be picked. Use it instead of maxDate={new Date()}, which breaks prerendering. */
  disableFuture?: boolean;
  /** Lists the newest year first, which suits dates of birth. */
  reverseYears?: boolean;
  /** Starts with the calendar open. */
  defaultOpen?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/** A date picker: a button showing the date, opening a calendar with month and year dropdowns. */
export function DateField({
  id,
  value,
  onChange,
  onBlur,
  name,
  disabled,
  placeholder = "DD/MM/YYYY",
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  disableFuture,
  reverseYears,
  defaultOpen = false,
  ref,
  label,
  error,
  helpText,
  className,
  ...mixProps
}: DateFieldProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    trigger: triggerProps,
    content: contentProps,
  } = splitProps(mixProps, ...fieldMixins, "trigger", "content");

  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) onBlur?.();
        }}
      >
        <PopoverTrigger
          render={
            <Button
              ref={ref}
              id={id}
              name={name}
              type="button"
              variant="outline"
              disabled={disabled}
              onBlur={() => {
                // Opening the calendar moves focus into it, which isn't the user leaving the field.
                if (!isOpen) onBlur?.();
              }}
              aria-invalid={!!error}
              aria-describedby={fieldDescribedBy(id, { error, helpText })}
              className={cn(
                "w-full justify-between border-input bg-transparent font-normal",
                !selected && "text-muted-foreground",
                triggerProps.className
              )}
            />
          }
        >
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
          <HugeiconsIcon icon={Calendar03Icon} aria-hidden className="text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent align="start" className={cn("w-auto p-0", contentProps.className)}>
          <DateCalendar
            selected={selected}
            minDate={minDate}
            maxDate={maxDate}
            disableFuture={disableFuture}
            reverseYears={reverseYears}
            onSelect={(date) => {
              // Clicking the chosen day again clears it in the calendar. Keep it, and just close.
              if (date) onChange(format(date, VALUE_FORMAT));
              setIsOpen(false);
              onBlur?.();
            }}
          />
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}
