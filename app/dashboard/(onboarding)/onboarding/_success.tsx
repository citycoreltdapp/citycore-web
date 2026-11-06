"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

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
    <div className="flex max-w-md flex-col items-center text-center">
      <p className="text-4xl font-bold tracking-tight">City Core</p>
      <div className="mt-20">
        <SuccessBadge />
      </div>
      <h1 className="mt-10 text-3xl font-bold tracking-tight">KYC Submitted Successfully!</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Welcome aboard! Your KYC is still in review, and your profile is pending.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-12 h-11 px-8 text-base")}>
        Back to Home
      </Link>
    </div>
  );
}
