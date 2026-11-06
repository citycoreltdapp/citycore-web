"use client";

import { motion, useReducedMotion } from "motion/react";

/** The circle springs in, then the tick draws itself. Shows the finished icon if the user prefers reduced motion. */
export function AuthSuccessIcon() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden
      className="mb-4 flex size-10 items-center justify-center rounded-full bg-success text-white"
      initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldReduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        />
      </svg>
    </motion.span>
  );
}
