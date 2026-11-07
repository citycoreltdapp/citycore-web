"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { type OnboardingFormData, SELFIE_UPLOAD } from "@/constant/onboarding";
import { Camera01Icon, CheckmarkCircle02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useDropzone } from "react-dropzone";
import { useController, useFormContext } from "react-hook-form";

import { SectionLabel, StepIntro } from "./_ui";

const TIPS = ["Face the camera in good light", "Keep your whole face in the frame", "No sunglasses, hats or filters"];

export function SelfieStep() {
  const { control, setError, clearErrors } = useFormContext<OnboardingFormData>();
  const { field, fieldState } = useController({ control, name: "selfie" });
  const [preview, setPreview] = React.useState(() => (field.value ? URL.createObjectURL(field.value) : null));

  const choose = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    field.onChange(file);
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: SELFIE_UPLOAD.accept,
    maxSize: SELFIE_UPLOAD.maxSize,
    multiple: false,
    noClick: true,
    onDropAccepted: ([file]) => {
      clearErrors("selfie");
      choose(file);
    },
    onDropRejected: () => setError("selfie", { message: SELFIE_UPLOAD.rejectedMessage }),
  });

  return (
    <>
      <StepIntro
        title="Let’s see you clearly"
        subtitle="Take a clear photo of yourself so we can match it to your NIN."
      />

      <div {...getRootProps({ className: "flex flex-col items-center gap-4 outline-none" })}>
        {/* capture opens the front camera on phones; desktops get the file picker. */}
        <input {...getInputProps({ id: "selfie", capture: "user", "aria-describedby": "selfie-status" })} />
        <button
          type="button"
          onClick={open}
          aria-label={preview ? "Retake photo" : "Take a photo"}
          className={cn(
            "relative flex h-72 w-56 items-center justify-center overflow-hidden rounded-[50%] bg-secondary ring-2 ring-primary/70 ring-offset-8 ring-offset-card transition outline-none focus-visible:ring-4 sm:h-80 sm:w-64",
            isDragActive && "ring-4 ring-accent",
            fieldState.error && "ring-destructive"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing for next/image to optimize
            <img src={preview} alt="Your selfie" className="size-full object-cover" />
          ) : (
            <span className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={UserIcon} aria-hidden className="size-12" />
            </span>
          )}
        </button>

        <p
          id="selfie-status"
          role={fieldState.error ? "alert" : "status"}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            fieldState.error ? "text-destructive" : preview ? "text-success" : "text-muted-foreground"
          )}
        >
          {fieldState.error?.message ??
            (preview ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-4" />
                Selfie ready
              </>
            ) : (
              "Drop a photo here or use your camera"
            ))}
        </p>

        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button type="button" variant="outline" onClick={open} className="h-12 rounded-xl bg-card text-base">
            <HugeiconsIcon icon={Camera01Icon} aria-hidden data-icon="inline-start" />
            {preview ? "Retake photo" : "Take a photo"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" onClick={() => choose(null)} className="h-10 rounded-xl">
              Remove photo
            </Button>
          )}
        </div>
      </div>

      <section aria-label="For a good photo" className="flex flex-col gap-3">
        <SectionLabel>For a good photo</SectionLabel>
        <ul className="grid gap-2 sm:grid-cols-3">
          {TIPS.map((tip) => (
            <li key={tip} className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/8">
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
