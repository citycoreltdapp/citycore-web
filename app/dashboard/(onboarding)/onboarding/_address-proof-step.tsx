"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type OnboardingFormData, UTILITY_BILL_UPLOAD } from "@/constant/onboarding";
import { formatFileSize } from "@/lib/file-info";
import { CheckmarkCircle02Icon, CloudUploadIcon, Delete02Icon, File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useDropzone } from "react-dropzone";
import { Controller, useController, useFormContext, useWatch } from "react-hook-form";

import { SectionLabel, StepIntro } from "./_ui";

function BillUpload() {
  const { control, setError, clearErrors } = useFormContext<OnboardingFormData>();
  const { field, fieldState } = useController({ control, name: "utilityBill" });
  const file = field.value;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: UTILITY_BILL_UPLOAD.accept,
    maxSize: UTILITY_BILL_UPLOAD.maxSize,
    multiple: false,
    onDropAccepted: ([next]) => {
      clearErrors("utilityBill");
      field.onChange(next);
    },
    onDropRejected: () => setError("utilityBill", { message: UTILITY_BILL_UPLOAD.rejectedMessage }),
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps({
          role: "button",
          "aria-label": file ? `Replace ${file.name}` : "Upload utility bill",
          className: cn(
            "flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            file
              ? "bg-card ring-1 ring-foreground/10 hover:bg-card/70"
              : "border-2 border-dashed border-foreground/15 bg-card/50 hover:border-foreground/30 hover:bg-card",
            isDragActive && "border-accent bg-accent/5",
            fieldState.error && "border-destructive"
          ),
        })}
      >
        <input {...getInputProps({ id: "utilityBill" })} />
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-xl",
            file ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"
          )}
        >
          <HugeiconsIcon icon={file ? File01Icon : CloudUploadIcon} aria-hidden className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-base font-semibold">{file.name}</span>
              <span className="flex items-center gap-1.5 text-sm text-success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-4" />
                {formatFileSize(file.size)} · click to replace
              </span>
            </>
          ) : (
            <>
              <span className="block text-base font-semibold">
                {isDragActive ? "Drop your bill here" : "Upload a utility bill"}
              </span>
              <span className="block text-sm text-muted-foreground">{UTILITY_BILL_UPLOAD.description}</span>
            </>
          )}
        </span>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Remove utility bill"
            onClick={(e) => {
              e.stopPropagation();
              field.onChange(null);
            }}
            className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} aria-hidden />
          </Button>
        )}
      </div>
      {fieldState.error && (
        <p role="alert" className="text-sm text-destructive">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
}

export function AddressProofStep({ onEditAddress }: { onEditAddress: () => void }) {
  const { control } = useFormContext<OnboardingFormData>();
  const [fullName, address, city, lga, state] = useWatch({
    control,
    name: ["fullName", "residentialAddress", "cityOfResidence", "lgaOfResidence", "stateOfResidence"],
  });

  return (
    <>
      <StepIntro title="Confirm where you live" subtitle="Add a clear utility bill showing the address you entered." />

      <section aria-label="Proof of address" className="flex flex-col gap-3">
        <SectionLabel>Proof of address</SectionLabel>
        <BillUpload />
      </section>

      <section aria-label="Before you submit" className="flex flex-col gap-3">
        <SectionLabel>Before you submit</SectionLabel>
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="min-w-0">
            <p className="text-base font-semibold">{fullName}</p>
            <p className="mt-1 text-sm">{[address, city, lga, state].filter(Boolean).join(", ")}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Your NIN details, selfie and utility bill will be sent for review together.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onEditAddress} className="h-9 shrink-0 rounded-full px-4">
            Edit address
          </Button>
        </div>
      </section>

      <Controller
        control={control}
        name="confirmed"
        render={({ field, fieldState }) => (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card/50 p-4 text-sm ring-1 ring-foreground/8">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={!!fieldState.error}
              className="mt-0.5 size-5"
            />
            <span>I confirm these details and documents are mine and are correct.</span>
          </label>
        )}
      />
    </>
  );
}
