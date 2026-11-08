"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  NIGERIAN_STATE_OPTIONS,
  NIN_PATTERN,
  type NinIdentity,
  ONBOARDING_DEFAULT_VALUES,
  ONBOARDING_STEPS,
  type OnboardingFormData,
  SELFIE_UPLOAD,
  UTILITY_BILL_UPLOAD,
  getLgaOptions,
  onboardingSchema,
} from "@/constant/onboarding";
import { formatFileSize } from "@/lib/file-info";
import { setKycStatus } from "@/lib/verification-status";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft02Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Delete02Icon,
  File01Icon,
  LockIcon,
  Search01Icon,
  Tick02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Controller, FormProvider, useController, useForm, useFormContext, useWatch } from "react-hook-form";

const LAST_STEP = ONBOARDING_STEPS.length - 1;
const FIELD_STYLES =
  "**:data-[slot=input]:h-12 **:data-[slot=input]:rounded-xl **:data-[slot=input]:bg-card **:data-[slot=input]:px-4 **:data-[slot=input]:text-base **:data-[slot=input]:read-only:bg-secondary **:data-[slot=select-trigger]:h-12 **:data-[slot=select-trigger]:w-full **:data-[slot=select-trigger]:rounded-xl **:data-[slot=select-trigger]:bg-card **:data-[slot=select-trigger]:px-4 **:data-[slot=select-trigger]:text-base **:data-[slot=label]:font-medium";
const SELFIE_TIPS = [
  "Face the camera in good light",
  "Keep your whole face in the frame",
  "No sunglasses, hats or filters",
];
const SUBMITTED = ["NIN details & address", "Selfie", "Utility bill"];
const SCALLOPS = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * 2 * Math.PI;
  return { cx: 60 + 47 * Math.cos(angle), cy: 60 + 47 * Math.sin(angle) };
});

const formatBirthDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

async function lookupNin(nin: string): Promise<NinIdentity> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  if (nin === "00000000000") throw new Error("No identity found. Check your NIN and try again.");
  return { nin, firstName: "Ada", surname: "Okafor", dateOfBirth: "1995-06-15", phone: "+234 8000000000" };
}

function StepIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="text-base text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-medium tracking-wider text-muted-foreground uppercase", className)}>{children}</p>
  );
}

function StateAndLgaFields() {
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

function NinRecordCard({ record }: { record: NinIdentity }) {
  const rows = [
    ["Full name", `${record.firstName} ${record.surname}`],
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

function IdentityStep() {
  const { control, setValue, setError, clearErrors, getFieldState, formState } = useFormContext<OnboardingFormData>();
  const nin = useWatch({ control, name: "nin" });
  const identity = useWatch({ control, name: "identity" });
  const [isLooking, setIsLooking] = useState(false);

  const findDetails = async () => {
    if (!NIN_PATTERN.test(nin.trim())) {
      setError("nin", { message: "NIN must be 11 digits" }, { shouldFocus: true });
      return;
    }
    clearErrors("nin");
    setIsLooking(true);
    try {
      setValue("identity", await lookupNin(nin.trim()), { shouldValidate: true });
    } catch (error) {
      setError("nin", { message: error instanceof Error ? error.message : "We couldn't find that NIN." });
    } finally {
      setIsLooking(false);
    }
  };

  const changeNin = () => {
    setValue("identity", null, { shouldValidate: false });
    setValue("nin", "");
    requestAnimationFrame(() => document.getElementById("nin")?.focus());
  };

  const recordError = getFieldState("identity", formState).error?.message;

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
              readOnly={!!identity}
              onChange={(v) => field.onChange(v.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !identity) {
                  e.preventDefault();
                  void findDetails();
                }
              }}
              error={fieldState.error?.message ?? (identity ? undefined : recordError)}
              inputClassName="tracking-widest tabular-nums"
            />
          )}
        />
        {identity ? (
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
      {identity && (
        <>
          <NinRecordCard record={identity} />
          <section aria-label="Your residential address" className="flex flex-col gap-4">
            <SectionLabel>Your residential address</SectionLabel>
            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="address"
                  label="Address"
                  placeholder="House number and street"
                  autoComplete="street-address"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="city"
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

function SelfieStep() {
  const { control, setError, clearErrors } = useFormContext<OnboardingFormData>();
  const { field, fieldState } = useController({ control, name: "selfie" });
  const [preview, setPreview] = useState(() => (field.value ? URL.createObjectURL(field.value) : null));

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
          {SELFIE_TIPS.map((tip) => (
            <li key={tip} className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/8">
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

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

function AddressProofStep({ onEditAddress }: { onEditAddress: () => void }) {
  const { control } = useFormContext<OnboardingFormData>();
  const [identity, address, city, lga, state] = useWatch({
    control,
    name: ["identity", "address", "city", "lgaOfResidence", "stateOfResidence"],
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
            <p className="text-base font-semibold">
              {identity?.firstName} {identity?.surname}
            </p>
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

function OnboardingSuccess() {
  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <SuccessBadge />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl">Verification submitted</h1>
      <p className="mt-3 text-base text-muted-foreground">
        We&apos;re reviewing your details now. We&apos;ll let you know once you&apos;re approved, and investing unlocks
        right after.
      </p>
      <ul className="mt-8 flex w-full flex-col rounded-2xl bg-card p-2 text-left ring-1 ring-foreground/10">
        {SUBMITTED.map((item) => (
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
  );
}

function StepRail({ current }: { current: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh p-3 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-[#121212] p-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-accent/20 blur-3xl"
        />
        <Image src="/assets/images/logo-grey.png" alt="CityCore" width={42} height={49} className="relative" />
        <div className="relative mt-16">
          <p className="text-sm text-white/50">Account verification</p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight">
            Three quick steps
            <br />
            to start investing
          </h2>
        </div>
        <ol className="relative mt-12 flex flex-col">
          {ONBOARDING_STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li
                key={step.title}
                aria-current={active ? "step" : undefined}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {index < LAST_STEP && (
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
          Your documents are encrypted and only used to verify your identity.
        </p>
      </div>
    </aside>
  );
}

function TopBar({ current, onBack }: { current: number; onBack: () => void }) {
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
        <p className="flex-1 text-center text-base font-semibold lg:text-left">Verification</p>
        <Link href="/dashboard" className="text-sm font-semibold underline-offset-4 transition-colors hover:underline">
          Finish later
        </Link>
      </div>
      <div className="mx-auto w-full max-w-[600px] px-5 pt-3 pb-4">
        <p className="text-sm text-muted-foreground">
          Step {current + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[current].title}
        </p>
        <div aria-hidden className="mt-2 grid grid-cols-3 gap-1.5">
          {ONBOARDING_STEPS.map((step, index) => (
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

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: ONBOARDING_DEFAULT_VALUES,
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control });
  const isStepValid = ONBOARDING_STEPS[currentStep].schema.safeParse(values).success;

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  };

  const submit = form.handleSubmit((data) => {
    console.log("KYC onboarding submitted", data);
    form.reset();
    setKycStatus("pending");
    setIsSubmitted(true);
    goToStep(0);
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStep === LAST_STEP) return submit(event);
    const canContinue = await form.trigger(ONBOARDING_STEPS[currentStep].fields, { shouldFocus: true });
    if (canContinue) goToStep(currentStep + 1);
  };

  if (isSubmitted) {
    return (
      <main className="light flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-5 py-12 text-foreground scheme-light">
        <OnboardingSuccess />
      </main>
    );
  }

  return (
    <div className="light grid min-h-dvh flex-1 bg-background text-foreground scheme-light lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
      <StepRail current={currentStep} />
      <main className="flex min-w-0 flex-col">
        <TopBar
          current={currentStep}
          onBack={() => (currentStep === 0 ? router.push("/dashboard") : goToStep(currentStep - 1))}
        />
        <FormProvider {...form}>
          <form method="post" noValidate onSubmit={handleSubmit} className={cn("flex flex-1 flex-col", FIELD_STYLES)}>
            <div
              key={currentStep}
              className="mx-auto flex w-full max-w-[600px] flex-1 animate-in flex-col gap-8 px-5 pt-4 pb-10 duration-300 fade-in slide-in-from-right-2 motion-reduce:animate-none"
            >
              {currentStep === 0 && <IdentityStep />}
              {currentStep === 1 && <SelfieStep />}
              {currentStep === LAST_STEP && <AddressProofStep onEditAddress={() => goToStep(0)} />}
            </div>
            <div className="sticky bottom-0 bg-linear-to-t from-background via-background to-background/0 pt-6">
              <div className="mx-auto w-full max-w-[600px] px-5 pb-6">
                <Button
                  type="submit"
                  isLoading={form.formState.isSubmitting}
                  disabled={!isStepValid}
                  className="h-13 w-full rounded-xl text-base"
                >
                  {currentStep === LAST_STEP ? "Submit for review" : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
}
