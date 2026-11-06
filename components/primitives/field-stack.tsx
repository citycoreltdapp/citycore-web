import * as React from "react";

import { cn } from "cn";

export function FieldStack({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

interface EmbeddedFieldRowProps extends React.ComponentProps<"div"> {
  when: boolean;
  layout?: "inline" | "stack";
}

/** A follow-up field that appears under its parent, tied to it by a connector line. */
function EmbeddedFieldRowRoot({ when, children, layout = "inline", className, ...props }: EmbeddedFieldRowProps) {
  if (!when) return null;

  return (
    <div
      className={cn(
        "relative ml-3 animate-in pl-5 fade-in slide-in-from-top-1",
        layout === "inline" ? "flex items-center gap-2" : "flex flex-col gap-2",
        className
      )}
      {...props}
    >
      <div className="absolute -top-3 left-0 h-[calc(50%+12px)] w-4 rounded-bl border-b border-l border-border" />
      {children}
    </div>
  );
}

function EmbeddedFieldRowLabel({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("shrink-0 text-sm font-medium text-muted-foreground", className)} {...props} />;
}

function EmbeddedFieldRowSuffix({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export const EmbeddedFieldRow = Object.assign(EmbeddedFieldRowRoot, {
  Label: EmbeddedFieldRowLabel,
  Suffix: EmbeddedFieldRowSuffix,
});
