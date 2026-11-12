"use client";

import { type FormEvent, useState } from "react";

import {
  useKycState,
  useSaveKycDetails,
  useSubmitKyc,
  useUploadSelfie,
  useUploadUtilityBill,
  useVerifyNin,
} from "@/actions/kyc";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  NIN_PATTERN,
  type NinIdentity,
  ONBOARDING_DEFAULT_VALUES,
  ONBOARDING_STEPS,
  type OnboardingFormData,
  SELFIE_UPLOAD,
  UTILITY_BILL_UPLOAD,
  onboardingSchema,
} from "@/constant/onboarding";
import type { KycState } from "@/constant/schemas/kyc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera01Icon, CheckmarkCircle02Icon, LockIcon, Search01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Controller, FormProvider, useController, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  DocumentUpload,
  FIELD_STYLES,
  OnboardingSuccess,
  SectionLabel,
  StateAndLgaFields,
  StepIntro,
  StepRail,
  TopBar,
} from "./_shared";

const LAST_STEP = ONBOARDING_STEPS.length - 1;
const SELFIE_TIPS = [
  "Face the camera in good light",
  "Keep your whole face in the frame",
  "No sunglasses, hats or filters",
];
const SUBMITTED = ["NIN details & address", "Selfie", "Utility bill"];

const formatBirthDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);

const fullName = (identity: NinIdentity) =>
  [identity.firstName, identity.middleName, identity.lastName].filter(Boolean).join(" ");

const stepFor = (kyc: KycState) => {
  if (kyc.nextStep === "submit") return LAST_STEP;
  if (kyc.nextStep === "upload_documents") return kyc.documents.selfie ? LAST_STEP : 1;
  return 0;
};

function NinRecordCard({ record }: { record: NinIdentity }) {
  const rows = [
    ["Full name", fullName(record)],
    ["Date of birth", record.dateOfBirth ? formatBirthDate(record.dateOfBirth) : "Not on record"],
    ["Phone", record.phone ?? "Not on record"],
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
  const verifyNin = useVerifyNin();

  const findDetails = () => {
    if (!NIN_PATTERN.test(nin.trim())) {
      setError("nin", { message: "NIN must be 11 digits" }, { shouldFocus: true });
      return;
    }
    clearErrors("nin");
    verifyNin.mutate(nin.trim(), {
      onSuccess: (kyc) => setValue("identity", kyc.identity, { shouldValidate: true }),
      onError: (error) => setError("nin", { message: error.message }),
    });
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
            isLoading={verifyNin.isPending}
            disabled={nin.length !== 11}
            className="h-12 rounded-xl text-base"
          >
            {!verifyNin.isPending && <HugeiconsIcon icon={Search01Icon} aria-hidden data-icon="inline-start" />}
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
              <StateAndLgaFields stateName="stateOfResidence" lgaName="lgaOfResidence" />
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
        <DocumentUpload
          name="utilityBill"
          title="Upload a utility bill"
          description={UTILITY_BILL_UPLOAD.description}
          documentLabel="utility bill"
          upload={UTILITY_BILL_UPLOAD}
        />
      </section>
      <section aria-label="Before you submit" className="flex flex-col gap-3">
        <SectionLabel>Before you submit</SectionLabel>
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="min-w-0">
            <p className="text-base font-semibold">{identity && fullName(identity)}</p>
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

export function IndividualOnboarding() {
  const { data: kyc } = useKycState();
  return kyc ? <IndividualFlow kyc={kyc} /> : null;
}

const formValuesFor = (kyc: KycState): OnboardingFormData => ({
  ...ONBOARDING_DEFAULT_VALUES,
  nin: kyc.nin.last4 ? `•••••••${kyc.nin.last4}` : "",
  identity: kyc.identity,
  address: kyc.details?.address.line1 ?? "",
  city: kyc.details?.address.city ?? "",
  stateOfResidence: kyc.details?.address.state ?? "",
  lgaOfResidence: kyc.details?.address.lga ?? "",
});

function IndividualFlow({ kyc }: { kyc: KycState }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() => stepFor(kyc));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const saveDetails = useSaveKycDetails();
  const uploadSelfie = useUploadSelfie();
  const uploadBill = useUploadUtilityBill();
  const submitKyc = useSubmitKyc();
  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: formValuesFor(kyc),
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control });

  const uploaded = {
    selfie: !!values.selfie || !!kyc.documents.selfie,
    utilityBill: !!values.utilityBill || !!kyc.documents.utilityBill,
  };
  const isStepValid =
    ONBOARDING_STEPS[currentStep].schema.safeParse(values).success &&
    (currentStep !== 1 || uploaded.selfie) &&
    (currentStep !== LAST_STEP || uploaded.utilityBill);
  const isSaving = saveDetails.isPending || uploadSelfie.isPending || uploadBill.isPending || submitKyc.isPending;

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  };

  const save = async () => {
    if (currentStep === 0) {
      const { address, city, lgaOfResidence, stateOfResidence } = form.getValues();
      await saveDetails.mutateAsync({
        line1: address,
        city,
        lga: lgaOfResidence,
        state: stateOfResidence,
        country: "NG",
      });
      return;
    }
    if (currentStep === 1) {
      const { selfie } = form.getValues();
      if (selfie) await uploadSelfie.mutateAsync(selfie);
      return;
    }
    const { utilityBill } = form.getValues();
    if (utilityBill) await uploadBill.mutateAsync(utilityBill);
    await submitKyc.mutateAsync();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canContinue = await form.trigger(ONBOARDING_STEPS[currentStep].fields, { shouldFocus: true });
    if (!canContinue) return;
    try {
      await save();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
      return;
    }
    if (currentStep < LAST_STEP) return goToStep(currentStep + 1);
    setIsSubmitted(true);
  };

  if (isSubmitted || kyc.nextStep === "await_review" || kyc.nextStep === "complete") {
    return (
      <OnboardingSuccess
        submitted={SUBMITTED}
        message="We’re reviewing your details now. We’ll let you know once you’re approved, and investing unlocks right after."
      />
    );
  }

  return (
    <div className="light grid min-h-dvh flex-1 bg-background text-foreground scheme-light lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
      <StepRail
        steps={ONBOARDING_STEPS}
        current={currentStep}
        eyebrow="Account verification"
        heading={
          <>
            Three quick steps
            <br />
            to start investing
          </>
        }
        footnote="Your documents are encrypted and only used to verify your identity."
      />
      <main className="flex min-w-0 flex-col">
        <TopBar
          steps={ONBOARDING_STEPS}
          current={currentStep}
          title="Verification"
          onBack={() => (currentStep === 0 ? router.push("/dashboard") : goToStep(currentStep - 1))}
        />
        <FormProvider {...form}>
          <form method="post" noValidate onSubmit={handleSubmit} className={cn("flex flex-1 flex-col", FIELD_STYLES)}>
            <div
              key={currentStep}
              className="mx-auto flex w-full max-w-[600px] flex-1 animate-in flex-col gap-8 px-5 pt-4 pb-10 duration-300 fade-in slide-in-from-right-2 motion-reduce:animate-none"
            >
              {kyc.rejectionReason && (
                <p
                  role="alert"
                  className="rounded-2xl bg-destructive/8 p-4 text-sm text-destructive ring-1 ring-destructive/20"
                >
                  {kyc.rejectionReason}
                </p>
              )}
              {currentStep === 0 && <IdentityStep />}
              {currentStep === 1 && <SelfieStep />}
              {currentStep === LAST_STEP && <AddressProofStep onEditAddress={() => goToStep(0)} />}
            </div>
            <div className="sticky bottom-0 bg-linear-to-t from-background via-background to-background/0 pt-6">
              <div className="mx-auto w-full max-w-[600px] px-5 pb-6">
                <Button
                  type="submit"
                  isLoading={isSaving}
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
