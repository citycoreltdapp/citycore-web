"use client";

import * as React from "react";

import { type FieldProps, FieldShell, fieldDescribedBy, fieldMixins } from "@/components/primitives/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { type MixinProps, splitProps } from "@/lib/mixin";
import { DEFAULT_PHONE_COUNTRY, type PhoneNumber } from "@/lib/phone-number";
import { Combobox } from "@base-ui/react/combobox";
import { ArrowDown01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { type TCountryCode, getCountryData } from "countries-list";
import { countries } from "country-flag-icons";
import * as CountryFlags from "country-flag-icons/react/3x2";
import { AsYouType, type CountryCode } from "libphonenumber-js";

interface CountryOption {
  name: string;
  prefix: string;
  countryCode: string;
  searchKey: string;
}

const COUNTRY_OPTIONS: CountryOption[] = countries.flatMap((countryCode) => {
  const { name, phone } = getCountryData(countryCode as TCountryCode);

  if (!name || !phone.length) return [];

  return phone.map((prefix) => ({
    name,
    prefix: `+${prefix}`,
    countryCode,
    searchKey: `${name} ${countryCode} +${prefix}`.toLowerCase(),
  }));
});

const CountryFlag = React.memo(function CountryFlag({ countryCode }: { countryCode: string }) {
  const Flag = CountryFlags[countryCode as keyof typeof CountryFlags] ?? CountryFlags.NG;

  return (
    <span className="inline-flex h-3.5 w-[21px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-border [&_svg]:block [&_svg]:size-full">
      <Flag aria-hidden />
    </span>
  );
});

const formatAsYouType = (digits: string, countryCode: string) =>
  new AsYouType(countryCode as CountryCode).input(digits);

interface PhoneNumberFieldProps
  extends
    FieldProps,
    MixinProps<"group", Omit<React.ComponentProps<typeof InputGroup>, "children">>,
    MixinProps<"input", Omit<React.ComponentProps<typeof InputGroupInput>, "id" | "value" | "onChange">>,
    MixinProps<"popup", Pick<React.ComponentProps<typeof Combobox.Popup>, "className">> {
  value: PhoneNumber;
  onChange: (value: PhoneNumber) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  disabled?: boolean;
  /** Starts with the country list open. */
  defaultOpen?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/** A phone number with a searchable country picker. Formats as you type. */
export function PhoneNumberField({
  id,
  value,
  onChange,
  onBlur,
  name,
  disabled,
  defaultOpen,
  ref,
  label,
  error,
  helpText,
  className,
  ...mixProps
}: PhoneNumberFieldProps) {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    group: groupProps,
    input: inputProps,
    popup: popupProps,
  } = splitProps(mixProps, ...fieldMixins, "group", "input", "popup");

  const [groupElement, setGroupElement] = React.useState<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const selectedCountry =
    COUNTRY_OPTIONS.find((country) => country.countryCode === value.countryCode) ??
    COUNTRY_OPTIONS.find((country) => country.countryCode === DEFAULT_PHONE_COUNTRY);

  const handleCountryChange = (country: CountryOption | null) => {
    if (!country) return;

    const digits = value.number.replace(/\D/g, "");

    onChange({ countryCode: country.countryCode, number: digits ? formatAsYouType(digits, country.countryCode) : "" });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const digits = raw.replace(/\D/g, "");
    const previousDigits = value.number.replace(/\D/g, "");
    // Backspacing over a space or bracket removes no digit, so take the digit before it instead.
    const isDeletingFormatting = digits.length === previousDigits.length && raw.length < value.number.length;
    const nextDigits = isDeletingFormatting ? digits.slice(0, -1) : digits;

    onChange({ ...value, number: nextDigits ? formatAsYouType(nextDigits, value.countryCode) : "" });
  };

  return (
    <FieldShell {...{ id, label, error, helpText, className, labelProps, errorProps, helpTextProps }}>
      <Combobox.Root
        items={COUNTRY_OPTIONS}
        defaultOpen={defaultOpen}
        disabled={disabled}
        value={selectedCountry}
        onValueChange={handleCountryChange}
        itemToStringLabel={(country) => country.searchKey}
        isItemEqualToValue={(a, b) => a.countryCode === b.countryCode && a.prefix === b.prefix}
      >
        <InputGroup {...groupProps} ref={setGroupElement}>
          <Combobox.Trigger
            type="button"
            aria-label="Country code"
            className="flex h-full shrink-0 items-center gap-1.5 self-stretch border-r border-input bg-transparent px-2.5 text-sm text-foreground outline-none select-none group-has-[[aria-invalid=true]]/input-group:border-destructive disabled:cursor-not-allowed data-popup-open:[&_svg]:rotate-180"
          >
            <CountryFlag countryCode={selectedCountry?.countryCode ?? DEFAULT_PHONE_COUNTRY} />
            <span className="tabular-nums">{selectedCountry?.prefix}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform"
            />
          </Combobox.Trigger>

          <InputGroupInput
            placeholder="Phone number"
            {...inputProps}
            ref={inputRef}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            value={value.number}
            onChange={handleNumberChange}
            onBlur={onBlur}
            aria-invalid={!!error}
            aria-describedby={fieldDescribedBy(id, { error, helpText })}
          />
        </InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner
            anchor={groupElement ?? undefined}
            side="bottom"
            align="start"
            sideOffset={4}
            className="isolate z-50"
          >
            <Combobox.Popup
              className={cn(
                "flex w-(--anchor-width) min-w-72 origin-(--transform-origin) flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                popupProps.className
              )}
            >
              <div className="flex items-center gap-2 border-b px-2.5 py-2">
                <HugeiconsIcon icon={Search01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <Combobox.Input
                  placeholder="Search country code"
                  className="h-6 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <Combobox.Empty className="px-2.5 text-sm text-muted-foreground not-empty:py-2 empty:hidden">
                No countries found
              </Combobox.Empty>

              <Combobox.List className="flex max-h-60 flex-col gap-0.5 overflow-y-auto p-1 empty:hidden">
                {(country: CountryOption) => (
                  <Combobox.Item
                    key={`${country.countryCode}-${country.prefix}`}
                    value={country}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2.5 text-sm text-foreground outline-hidden select-none data-highlighted:bg-muted data-selected:bg-muted"
                  >
                    <CountryFlag countryCode={country.countryCode} />
                    <span className="tabular-nums">{country.prefix}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center text-primary">
                      <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </FieldShell>
  );
}
