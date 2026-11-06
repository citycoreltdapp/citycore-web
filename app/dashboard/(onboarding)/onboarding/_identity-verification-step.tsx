"use client";

import { FileUpload } from "@/components/primitives/file-upload";
import { TextField } from "@/components/primitives/text-field";
import { DOCUMENT_UPLOAD, type OnboardingFormData } from "@/constant/onboarding";
import { Controller, useFormContext } from "react-hook-form";

function DocumentUpload({ name, label }: { name: "idCard" | "passportPhotograph"; label: string }) {
  const { control, setError, clearErrors } = useFormContext<OnboardingFormData>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FileUpload
          id={name}
          label={label}
          description={DOCUMENT_UPLOAD.description}
          dropzoneAccept={DOCUMENT_UPLOAD.accept}
          dropzoneMaxSize={DOCUMENT_UPLOAD.maxSize}
          items={
            field.value
              ? [{ id: name, name: field.value.name, size: field.value.size, status: "completed" as const }]
              : []
          }
          onFilesAdded={([file]) => {
            clearErrors(name);
            field.onChange(file);
          }}
          onFilesRejected={() => setError(name, { message: DOCUMENT_UPLOAD.rejectedMessage })}
          onRemove={() => field.onChange(null)}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function IdentityVerificationStep() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <>
      <Controller
        control={control}
        name="nin"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="nin"
            label="NIN Number"
            placeholder="Enter your 11-digit NIN"
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="bvn"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="bvn"
            label="BVN Number"
            placeholder="Enter your 11-digit BVN"
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            error={fieldState.error?.message}
          />
        )}
      />

      <DocumentUpload name="idCard" label="Upload Valid ID Card" />
      <DocumentUpload name="passportPhotograph" label="Passport Photograph" />
    </>
  );
}
