"use client";

import * as React from "react";

import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { NIN_PATTERN, type OnboardingFormData } from "@/constant/onboarding";
import { LockIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { StateAndLgaFields } from "./_state-and-lga-fields";
import { SectionLabel, StepIntro, formatBirthDate } from "./_ui";

type NinRecord = Pick<OnboardingFormData, "fullName" | "dateOfBirth" | "phone">;

// ponytail: no identity provider yet, so every valid NIN returns this sample record. Send the NIN to the lookup API here.
async function lookupNin(): Promise<NinRecord> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { fullName: "Ada Okafor", dateOfBirth: "1995-06-15", phone: "+234 800 000 0000" };
}

const RECORD_FIELDS = ["fullName", "dateOfBirth", "phone"] as const;

function NinRecordCard({ record }: { record: NinRecord }) {
  const rows = [
    ["Full name", record.fullName],
    ["Date of birth", formatBirthDate(record.dateOfBirth)],
    ["Phone", record.phone],
  ];
  return (
    <section
      aria-label="Details from your NIN"
      className="animate-in rounded-2xl bg-card p-5 ring-1 ring-foreground/10 duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">
          <HugeiconsIcon icon={LockIcon} aria-hidden className="size-4" />
        </span>
        <h2 className="text-base font-semibold">Details from your NIN</h2>
      </div>
      <dl className="mt-4 flex flex-col">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-border py-3 text-sm last:border-none">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Your name, date of birth and phone are locked to your NIN record and can&apos;t be edited here.
      </p>
    </section>
  );
}

export function IdentityStep() {
  const { control, setValue, setError, clearErrors, getFieldState, formState } = useFormContext<OnboardingFormData>();
  const nin = useWatch({ control, name: "nin" });
  const fullName = useWatch({ control, name: "fullName" });
  const dateOfBirth = useWatch({ control, name: "dateOfBirth" });
  const phone = useWatch({ control, name: "phone" });
  const [isLooking, setIsLooking] = React.useState(false);
  const found = !!fullName;

  const findDetails = async () => {
    if (!NIN_PATTERN.test(nin.trim())) {
      setError("nin", { message: "NIN must be 11 digits" }, { shouldFocus: true });
      return;
    }
    clearErrors("nin");
    setIsLooking(true);
    try {
      const record = await lookupNin();
      for (const key of RECORD_FIELDS) setValue(key, record[key], { shouldValidate: true });
    } catch {
      setError("nin", { message: "We couldn't find that NIN. Check it and try again." });
    } finally {
      setIsLooking(false);
    }
  };

  const changeNin = () => {
    for (const key of RECORD_FIELDS) setValue(key, "", { shouldValidate: false });
    setValue("nin", "");
    requestAnimationFrame(() => document.getElementById("nin")?.focus());
  };

  const recordError = getFieldState("fullName", formState).error?.message;

  return (
    <>
      <StepIntro title="Start with your NIN" subtitle="Find your identity details, then tell us where you live." />

      <div className="flex flex-col gap-3">
        <Controller
          control={control}
          name="nin"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="nin"
              label="National identification number"
              placeholder="11-digit NIN"
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              readOnly={found}
              onChange={(v) => field.onChange(v.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !found) {
                  e.preventDefault();
                  void findDetails();
                }
              }}
              error={fieldState.error?.message ?? (found ? undefined : recordError)}
              inputClassName="tracking-widest tabular-nums"
            />
          )}
        />
        {found ? (
          <button
            type="button"
            onClick={changeNin}
            className="self-end text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Change NIN
          </button>
        ) : (
          <Button
            type="button"
            onClick={findDetails}
            isLoading={isLooking}
            disabled={nin.length !== 11}
            className="h-12 rounded-xl text-base"
          >
            {!isLooking && <HugeiconsIcon icon={Search01Icon} aria-hidden data-icon="inline-start" />}
            Find my details
          </Button>
        )}
      </div>

      {found && (
        <>
          <NinRecordCard record={{ fullName, dateOfBirth, phone }} />

          <section aria-label="Your residential address" className="flex flex-col gap-4">
            <SectionLabel>Your residential address</SectionLabel>
            <Controller
              control={control}
              name="residentialAddress"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="residentialAddress"
                  label="Address"
                  placeholder="House number and street"
                  autoComplete="street-address"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="cityOfResidence"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="cityOfResidence"
                  label="City"
                  placeholder="e.g. Ikeja"
                  autoComplete="address-level2"
                  error={fieldState.error?.message}
                />
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <StateAndLgaFields />
            </div>
          </section>
        </>
      )}
    </>
  );
}
