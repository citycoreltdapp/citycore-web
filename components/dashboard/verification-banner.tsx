"use client";

import * as React from "react";

import { useCurrentUser } from "@/actions/auth";
import { ProgressRing } from "@/components/primitives/progress-ring";
import { Button } from "@/components/ui/button";
import { CORPORATE_ONBOARDING_STEPS } from "@/constant/corporate-onboarding";
import { ONBOARDING_STEPS } from "@/constant/onboarding";
import { useKycStatus } from "@/lib/verification-status";
import { AlertCircleIcon, ArrowRight02Icon, Cancel01Icon, HourglassIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

const stepsFor = (corporate: boolean) => [
  "Account created",
  ...(corporate ? CORPORATE_ONBOARDING_STEPS : ONBOARDING_STEPS).map((step) => step.title),
];

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol aria-label="Verification steps" className="hidden items-center gap-1.5 xl:flex">
      {steps.map((step, index) => {
        const done = index === 0;
        return (
          <li key={step} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden className="h-px w-4 bg-white/15" />}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
                done ? "bg-white/10 text-white" : "text-white/50"
              )}
            >
              {done ? (
                <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4 text-accent" />
              ) : (
                <span aria-hidden className="text-xs tabular-nums">
                  {index}
                </span>
              )}
              {step}
              <span className="sr-only">{done ? " · done" : " · to do"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Hangs under the header until the investor's KYC is approved. */
export function VerificationBanner() {
  const status = useKycStatus();
  const { data: user } = useCurrentUser();
  const corporate = user?.accountType === "corporate";
  const steps = stepsFor(corporate);
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = React.useState(false);

  if (!status || status === "verified" || (status === "pending" && dismissed)) return null;
  const inReview = status === "pending";
  const needsAttention = status === "actionRequired";

  return (
    <div className="shrink-0 bg-sidebar px-4 pb-3 md:px-6">
      <motion.section
        aria-label="Account verification"
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-[#121212] py-3 pr-3 pl-3.5 text-white ring-1 ring-white/10 sm:gap-4"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-accent/25 blur-3xl"
        />

        {inReview ? (
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10">
            <HugeiconsIcon icon={HourglassIcon} aria-hidden className="size-6 text-accent" />
          </span>
        ) : needsAttention ? (
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10">
            <HugeiconsIcon icon={AlertCircleIcon} aria-hidden className="size-6 text-warning" />
          </span>
        ) : (
          <ProgressRing
            value={100 / steps.length}
            label={`1/${steps.length}`}
            aria-label={`Step 1 of ${steps.length} done`}
            className="relative size-12 text-white [&>span]:text-xs"
            trackClassName="stroke-white/15"
            indicatorClassName="stroke-accent"
          />
        )}

        <div className="relative min-w-0 flex-1">
          <p className="truncate text-base font-semibold">
            {inReview
              ? "Your verification is in review"
              : needsAttention
                ? "Your verification needs attention"
                : corporate
                  ? "Verify your business to start investing"
                  : "Verify your identity to start investing"}
          </p>
          <p className="hidden truncate text-sm text-white/60 sm:block">
            {inReview
              ? "We'll let you know once it's approved. Investing unlocks right after."
              : needsAttention
                ? "Review your details and resubmit. Investing and withdrawals unlock once you're verified."
                : corporate
                  ? "Have your CAC number and a utility bill ready. You can explore meanwhile, but investing stays locked."
                  : "Have your NIN and a utility bill ready. You can explore meanwhile, but investing stays locked."}
          </p>
        </div>

        {inReview ? (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Hide until next visit"
            onClick={() => setDismissed(true)}
            className="relative shrink-0 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden />
          </Button>
        ) : (
          <>
            {!needsAttention && <Steps steps={steps} />}
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/onboarding" />}
              className="relative h-10 shrink-0 rounded-full bg-accent px-5 text-sm text-accent-foreground hover:bg-accent/85"
            >
              <span className="sm:hidden">{needsAttention ? "Review" : "Verify"}</span>
              <span className="hidden sm:inline">{needsAttention ? "Review details" : "Complete verification"}</span>
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden data-icon="inline-end" />
            </Button>
          </>
        )}
      </motion.section>
    </div>
  );
}
