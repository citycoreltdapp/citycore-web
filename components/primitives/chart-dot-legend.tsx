import * as React from "react";

import { cn } from "cn";

export interface ChartDotLegendItem {
  key: string;
  label: React.ReactNode;
  color: string;
}

/** The round-dot legend the chart primitives share. */
export function ChartDotLegend({ items, className }: { items: ChartDotLegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
