"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ONBOARDING_DEFAULT_VALUES, ONBOARDING_STEPS, onboardingSchema } from "@/constant/onboarding";
import { setVerificationStatus } from "@/lib/verification-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft02Icon, LockIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { AddressProofStep } from "./_address-proof-step";
import { IdentityStep } from "./_identity-step";
import { SelfieStep } from "./_selfie-step";
import { OnboardingSuccess } from "./_success";

const LAST_STEP = ONBOARDING_STEPS.length - 1;

const FIELD_STYLES =
  "**:data-[slot=input]:h-12 **:data-[slot=input]:rounded-xl **:data-[slot=input]:bg-card **:data-[slot=input]:px-4 **:data-[slot=input]:text-base **:data-[slot=input]:read-only:bg-secondary **:data-[slot=select-trigger]:h-12 **:data-[slot=select-trigger]:w-full **:data-[slot=select-trigger]:rounded-xl **:data-[slot=select-trigger]:bg-card **:data-[slot=select-trigger]:px-4 **:data-[slot=select-trigger]:text-base **:data-[slot=label]:font-medium";

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
        <Link href="/" className="text-sm font-semibold underline-offset-4 transition-colors hover:underline">
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

export function Client$OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: ONBOARDING_DEFAULT_VALUES,
    // Each step is checked with trigger(), which doesn't turn on re-validation the way a submit does.
    mode: "onTouched",
  });

  // formState.isValid covers the whole form, but the button only cares about the step on screen.
  const values = useWatch({ control: form.control });
  const isStepValid = ONBOARDING_STEPS[currentStep].schema.safeParse(values).success;

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  };

  const submit = form.handleSubmit((data) => {
    // ponytail: no backend yet, so this only logs. The values include the NIN and documents, so replace this with the API call.
    console.log("KYC onboarding submitted", data);
    form.reset();
    setVerificationStatus("in-review");
    setIsSubmitted(true);
    goToStep(0);
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
          onBack={() => (currentStep === 0 ? router.push("/") : goToStep(currentStep - 1))}
        />

        <FormProvider {...form}>
          {/* POST, so a submit before hydration can't put the NIN in the URL. */}
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
