"use client";

import { SelectField } from "@/components/primitives/select-field";
import { NIGERIAN_STATE_OPTIONS, type OnboardingFormData, getLgaOptions } from "@/constant/onboarding";
import { Controller, useFormContext, useWatch } from "react-hook-form";

interface StateAndLgaFieldsProps {
  stateName: "stateOfOrigin" | "stateOfResidence";
  lgaName: "lgaOfOrigin" | "lgaOfResidence";
  stateLabel: string;
  lgaLabel: string;
}

/** A state select and a local government select that only lists that state's LGAs. */
export function StateAndLgaFields({ stateName, lgaName, stateLabel, lgaLabel }: StateAndLgaFieldsProps) {
  const { control, resetField } = useFormContext<OnboardingFormData>();
  const state = useWatch({ control, name: stateName });

  return (
    <>
      <Controller
        control={control}
        name={stateName}
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id={stateName}
            label={stateLabel}
            placeholder="Select"
            items={NIGERIAN_STATE_OPTIONS}
            contentClassName="light max-h-72"
            onChange={(nextState) => {
              field.onChange(nextState);
              // The chosen LGA belongs to the old state. A full reset, so the empty field isn't flagged yet.
              resetField(lgaName, { defaultValue: "" });
            }}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name={lgaName}
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id={lgaName}
            label={lgaLabel}
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
