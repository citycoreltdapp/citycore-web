"use client";

import * as React from "react";

import { annotate } from "rough-notation";

type HighlighterProps = React.PropsWithChildren<{
  action?: "highlight" | "underline" | "box" | "circle";
  color?: string;
  strokeWidth?: number;
  padding?: number;
  animationDuration?: number;
}>;

/** Hand-drawn emphasis on inline text. The stroke draws itself in once, unless the user prefers reduced motion. */
export function Highlighter({
  children,
  action = "underline",
  color = "#D0A07C",
  strokeWidth = 3,
  padding = 4,
  animationDuration = 800,
}: HighlighterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      padding,
      animationDuration,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      multiline: true,
    });
    annotation.show();

    const redraw = () => {
      annotation.hide();
      annotation.show();
    };
    window.addEventListener("resize", redraw);

    return () => {
      window.removeEventListener("resize", redraw);
      annotation.remove();
    };
  }, [action, color, strokeWidth, padding, animationDuration]);

  return (
    <span ref={ref} className="relative inline-block">
      {children}
    </span>
  );
}
