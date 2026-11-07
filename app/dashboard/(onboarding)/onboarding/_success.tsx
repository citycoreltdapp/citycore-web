"use client";

import { buttonVariants } from "@/components/ui/button";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

const SUBMITTED = ["NIN details & address", "Selfie", "Utility bill"];

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

export function OnboardingSuccess() {
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

      <Link href="/" className={cn(buttonVariants(), "mt-8 h-13 w-full rounded-xl text-base")}>
        Go to dashboard
      </Link>
    </div>
  );
}
