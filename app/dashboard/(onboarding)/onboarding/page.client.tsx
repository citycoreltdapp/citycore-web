"use client";

import * as React from "react";

import { Stepper } from "@/components/primitives/stepper";
import { Button } from "@/components/ui/button";
import { ONBOARDING_DEFAULT_VALUES, ONBOARDING_STEPS, onboardingSchema } from "@/constant/onboarding";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { IdentityVerificationStep } from "./_identity-verification-step";
import { PersonalInfoStep } from "./_personal-info-step";
import { ReviewStep } from "./_review-step";
import { OnboardingSuccess } from "./_success";

const IDENTITY_STEP = 1;
const REVIEW_STEP = ONBOARDING_STEPS.length - 1;

const FIELD_STYLES =
  "**:data-[slot=input]:h-10 **:data-[slot=input-group]:h-10 **:data-[slot=label]:font-normal **:data-[slot=select-trigger]:data-[size=default]:h-10";

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
    // ponytail: no backend yet, so this only logs. The values include NIN and BVN, so replace this with the API call.
    console.log("KYC onboarding submitted", data);
    form.reset();
    setIsSubmitted(true);
    goToStep(0);
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep === REVIEW_STEP) return submit(event);

    const canContinue = await form.trigger(ONBOARDING_STEPS[currentStep].fields, { shouldFocus: true });

    if (canContinue) goToStep(currentStep + 1);
  };

  return (
    <main className="light flex min-h-dvh flex-1 flex-col items-center bg-card px-4 py-12 text-foreground scheme-light">
      {isSubmitted ? (
        <OnboardingSuccess />
      ) : (
        <>
          <h1 className="text-center text-4xl font-bold tracking-tight">KYC Onboarding</h1>
          <Stepper steps={ONBOARDING_STEPS} currentStep={currentStep} className="mt-8 w-full max-w-[625px]" />
          <p className="mt-6 text-center text-lg text-muted-foreground">Setup your account to complete your profile.</p>

          <FormProvider {...form}>
            {/* POST, so a submit before hydration can't put NIN or BVN in the URL. */}
            <form
              method="post"
              noValidate
              onSubmit={handleSubmit}
              className={`mt-8 flex w-full max-w-[560px] flex-col gap-4 ${FIELD_STYLES}`}
            >
              {currentStep === 0 && <PersonalInfoStep />}
              {currentStep === IDENTITY_STEP && <IdentityVerificationStep />}
              {currentStep === REVIEW_STEP && <ReviewStep onEditDocuments={() => goToStep(IDENTITY_STEP)} />}

              <div className="mt-6 flex justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-36 border-primary text-base text-primary hover:text-primary"
                  onClick={() => (currentStep === 0 ? router.push("/") : goToStep(currentStep - 1))}
                >
                  {currentStep === 0 ? "Cancel" : "Back"}
                </Button>
                <Button
                  type="submit"
                  isLoading={form.formState.isSubmitting}
                  disabled={!isStepValid}
                  className="h-11 w-36 text-base"
                >
                  {currentStep === REVIEW_STEP ? "Submit" : "Continue"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </>
      )}
    </main>
  );
}
