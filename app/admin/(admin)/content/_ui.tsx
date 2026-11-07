"use client";
import * as React from "react";

import { useReviewRequests } from "../_operations/requests";

export type Reviews = ReturnType<typeof useReviewRequests>;

export function CardHeader({ title, note, children }: { title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </div>
  );
}

export function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border p-5 first:border-none">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
