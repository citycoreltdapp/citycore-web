"use client";

import { SelectField } from "@/components/primitives/select-field";
import { NIGERIAN_STATE_OPTIONS, type OnboardingFormData, getLgaOptions } from "@/constant/onboarding";
import { Controller, useFormContext, useWatch } from "react-hook-form";

/** A state select and a local government select that only lists that state's LGAs. */
export function StateAndLgaFields() {
  const { control, resetField } = useFormContext<OnboardingFormData>();
  const state = useWatch({ control, name: "stateOfResidence" });

  return (
    <>
      <Controller
        control={control}
        name="stateOfResidence"
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id="stateOfResidence"
            label="State"
            placeholder="Select"
            items={NIGERIAN_STATE_OPTIONS}
            contentClassName="light max-h-72"
            onChange={(nextState) => {
              field.onChange(nextState);
              // The chosen LGA belongs to the old state. A full reset, so the empty field isn't flagged yet.
              resetField("lgaOfResidence", { defaultValue: "" });
            }}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="lgaOfResidence"
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id="lgaOfResidence"
            label="Local government area"
            placeholder={state ? "Select" : "Select a state first"}
            items={getLgaOptions(state)}
            disabled={!state}
            contentClassName="light max-h-72"
            error={fieldState.error?.message}
          />
        )}
      />
    </>
  );
}
