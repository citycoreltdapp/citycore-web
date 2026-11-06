"use client";

import { DateField } from "@/components/primitives/date-field";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { GENDER_OPTIONS, type OnboardingFormData } from "@/constant/onboarding";
import { Controller, useFormContext } from "react-hook-form";

import { StateAndLgaFields } from "./_state-and-lga-fields";

export function PersonalInfoStep() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <>
      <Controller
        control={control}
        name="surname"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="surname"
            label="Surname"
            placeholder="Adeleke"
            autoComplete="family-name"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="firstName"
            label="First Name"
            placeholder="David"
            autoComplete="given-name"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="otherName"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="otherName"
            label="Other Name"
            placeholder="Peters"
            autoComplete="additional-name"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phoneNumber"
        render={({ field, fieldState }) => (
          <PhoneNumberField
            {...field}
            id="phoneNumber"
            label="Phone Number"
            inputPlaceholder="0802 345 6789"
            popupClassName="light"
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="gender"
          render={({ field, fieldState }) => (
            <SelectField
              {...field}
              id="gender"
              label="Gender"
              placeholder="Select"
              items={GENDER_OPTIONS}
              contentClassName="light"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field, fieldState }) => (
            <DateField
              {...field}
              id="dateOfBirth"
              label="Date Of Birth"
              disableFuture
              reverseYears
              triggerClassName="h-10"
              contentClassName="light"
              error={fieldState.error?.message}
            />
          )}
        />

        <StateAndLgaFields
          stateName="stateOfOrigin"
          lgaName="lgaOfOrigin"
          stateLabel="State Of Origin"
          lgaLabel="Local Government Of Origin"
        />
      </div>

      <Controller
        control={control}
        name="residentialAddress"
        render={({ field, fieldState }) => (
          <TextAreaField
            {...field}
            id="residentialAddress"
            label="Residential Address"
            placeholder="17c Crescent Avenue Lagos"
            autoComplete="street-address"
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StateAndLgaFields
          stateName="stateOfResidence"
          lgaName="lgaOfResidence"
          stateLabel="State Of Residence"
          lgaLabel="Local Government Of Residence"
        />
      </div>

      <Controller
        control={control}
        name="cityOfResidence"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="cityOfResidence"
            label="City Of Residence"
            placeholder="Port Harcourt"
            autoComplete="address-level2"
            error={fieldState.error?.message}
          />
        )}
      />
    </>
  );
}
