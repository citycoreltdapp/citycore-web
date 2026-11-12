"use client";

import type { ReactNode } from "react";

import { SelectField } from "@/components/primitives/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { NIGERIAN_STATE_OPTIONS, getLgaOptions } from "@/constant/onboarding";
import { formatFileSize } from "@/lib/file-info";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Delete02Icon,
  File01Icon,
  LockIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { type Accept, useDropzone } from "react-dropzone";
import { Controller, useController, useFormContext, useWatch } from "react-hook-form";

export const FIELD_STYLES =
  "**:data-[slot=input]:h-12 **:data-[slot=input]:rounded-xl **:data-[slot=input]:bg-card **:data-[slot=input]:px-4 **:data-[slot=input]:text-base **:data-[slot=input]:read-only:bg-secondary **:data-[slot=select-trigger]:h-12 **:data-[slot=select-trigger]:w-full **:data-[slot=select-trigger]:rounded-xl **:data-[slot=select-trigger]:bg-card **:data-[slot=select-trigger]:px-4 **:data-[slot=select-trigger]:text-base **:data-[slot=label]:font-medium";

export interface OnboardingStep {
  title: string;
  description: string;
}

export function StepIntro({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="text-base text-muted-foreground">{subtitle}</p>
    </header>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-medium tracking-wider text-muted-foreground uppercase", className)}>{children}</p>
  );
}

/** A state picker and its LGA picker, which resets whenever the state changes. */
export function StateAndLgaFields({ stateName, lgaName }: { stateName: string; lgaName: string }) {
  const { control, resetField } = useFormContext();
  const state: string = useWatch({ control, name: stateName });

  return (
    <>
      <Controller
        control={control}
        name={stateName}
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id={stateName}
            label="State"
            placeholder="Select"
            items={NIGERIAN_STATE_OPTIONS}
            contentClassName="light max-h-72"
            onChange={(nextState) => {
              field.onChange(nextState);
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

interface DocumentUploadProps {
  name: string;
  /** What the empty row says, such as "Upload a utility bill". */
  title: string;
  description: ReactNode;
  /** Names the document in labels, such as "utility bill". */
  documentLabel: string;
  upload: { accept: Accept; maxSize: number; rejectedMessage: string };
  /** A small tag beside the title, such as "Optional". */
  tag?: string;
}

/** A drop zone for one file, which turns into the file's row once one is chosen. */
export function DocumentUpload({ name, title, description, documentLabel, upload, tag }: DocumentUploadProps) {
  const { control, setError, clearErrors } = useFormContext();
  const { field, fieldState } = useController({ control, name });
  const file: File | null = field.value;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: upload.accept,
    maxSize: upload.maxSize,
    multiple: false,
    onDropAccepted: ([next]) => {
      clearErrors(name);
      field.onChange(next);
    },
    onDropRejected: () => setError(name, { message: upload.rejectedMessage }),
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps({
          role: "button",
          "aria-label": file ? `Replace ${file.name}` : `Upload ${documentLabel}`,
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
        <input {...getInputProps({ id: name })} />
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
              <span className="flex items-center gap-2 text-base font-semibold">
                {isDragActive ? "Drop it here" : title}
                {tag && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {tag}
                  </span>
                )}
              </span>
              <span className="block text-sm text-muted-foreground">{description}</span>
            </>
          )}
        </span>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={`Remove ${documentLabel}`}
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

const SCALLOPS = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * 2 * Math.PI;
  return { cx: 60 + 47 * Math.cos(angle), cy: 60 + 47 * Math.sin(angle) };
});

function SuccessBadge() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg viewBox="0 0 120 120" aria-hidden className="size-32 overflow-visible">
      <motion.g
        style={{ transformOrigin: "center" }}
        initial={shouldReduceMotion ? false : { scale: 0, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <circle cx="60" cy="60" r="48" className="fill-success" />
        {SCALLOPS.map(({ cx, cy }) => (
          <circle key={cx} cx={cx} cy={cy} r="11" className="fill-success" />
        ))}
        <circle cx="60" cy="60" r="41" className="fill-secondary" />
      </motion.g>
      <motion.path
        d="M44 61l11 11 21-22"
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-success"
        initial={shouldReduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

export function OnboardingSuccess({ message, submitted }: { message: ReactNode; submitted: string[] }) {
  return (
    <main className="light flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-5 py-12 text-foreground scheme-light">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <SuccessBadge />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl">Verification submitted</h1>
        <p className="mt-3 text-base text-muted-foreground">{message}</p>
        <ul className="mt-8 flex w-full flex-col rounded-2xl bg-card p-2 text-left ring-1 ring-foreground/10">
          {submitted.map((item) => (
            <li key={item} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm">
              <span className="font-medium">{item}</span>
              <span className="flex items-center gap-1.5 text-success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-4" />
                Received
              </span>
            </li>
          ))}
        </ul>
        <Link href="/dashboard" className={cn(buttonVariants(), "mt-8 h-13 w-full rounded-xl text-base")}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

interface StepRailProps {
  steps: readonly OnboardingStep[];
  current: number;
  eyebrow: string;
  heading: ReactNode;
  footnote: string;
}

export function StepRail({ steps, current, eyebrow, heading, footnote }: StepRailProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh p-3 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-[#121212] p-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-accent/20 blur-3xl"
        />
        <Image src="/assets/images/logo-grey.png" alt="CityCore" width={42} height={49} className="relative" />
        <div className="relative mt-16">
          <p className="text-sm text-white/50">{eyebrow}</p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight">{heading}</h2>
        </div>
        <ol className="relative mt-12 flex flex-col">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li
                key={step.title}
                aria-current={active ? "step" : undefined}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {index < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={cn("absolute top-10 bottom-2 left-[17px] w-px", done ? "bg-accent" : "bg-white/15")}
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors",
                    done && "bg-accent text-[#121212]",
                    active && "bg-white text-[#121212]",
                    !done && !active && "text-white/50 ring-1 ring-white/20"
                  )}
                >
                  {done ? <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4" /> : index + 1}
                </span>
                <span className="pt-1">
                  <span className={cn("block text-base font-semibold", !done && !active && "text-white/50")}>
                    {step.title}
                  </span>
                  <span className="block text-sm text-white/50">{step.description}</span>
                  <span className="sr-only">{done ? " · done" : active ? " · current step" : ""}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="relative mt-auto flex items-start gap-3 text-sm/6 text-white/60">
          <HugeiconsIcon icon={LockIcon} aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
          {footnote}
        </p>
      </div>
    </aside>
  );
}

interface TopBarProps {
  steps: readonly OnboardingStep[];
  current: number;
  title: string;
  onBack: () => void;
}

export function TopBar({ steps, current, title, onBack }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[600px] items-center gap-3 px-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={current === 0 ? "Back to dashboard" : "Previous step"}
          className="-ml-2 flex size-10 items-center justify-center rounded-full transition-colors outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} aria-hidden className="size-5" />
        </button>
        <p className="flex-1 text-center text-base font-semibold lg:text-left">{title}</p>
        <Link href="/dashboard" className="text-sm font-semibold underline-offset-4 transition-colors hover:underline">
          Finish later
        </Link>
      </div>
      <div className="mx-auto w-full max-w-[600px] px-5 pt-3 pb-4">
        <p className="text-sm text-muted-foreground">
          Step {current + 1} of {steps.length} · {steps[current].title}
        </p>
        <div
          aria-hidden
          className="mt-2 grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => (
            <span
              key={step.title}
              className={cn(
                "h-1 rounded-full transition-colors duration-500",
                index <= current ? "bg-primary" : "bg-foreground/10"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
