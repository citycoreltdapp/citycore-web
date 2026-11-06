"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { type Investment, availableUnits } from "./_data";

export function InvestmentPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="border ring-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

export function InvestmentHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function Allocation({ investment }: { investment: Investment }) {
  const allocated = (investment.allocatedUnits / investment.totalUnits) * 100;

  return (
    <div className="space-y-2">
      <Progress
        aria-label={`${investment.name} allocation`}
        value={allocated}
        className="**:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-accent"
      />
      <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>{Math.round(allocated)}% allocated</span>
        <span>
          {availableUnits(investment).toLocaleString("en-NG")} of {investment.totalUnits.toLocaleString("en-NG")} left
        </span>
      </p>
    </div>
  );
}

export function InvestmentFacts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3 text-xs text-primary">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <dt>{label}</dt>
          <span aria-hidden>·</span>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
