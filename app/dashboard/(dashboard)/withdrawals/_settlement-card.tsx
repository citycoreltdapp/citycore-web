import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SETTLEMENT_STEPS } from "@/constant/withdrawal";

export function SettlementCard() {
  return (
    <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <h2 className="text-base font-semibold">Settlement tracking</h2>
      <ol className="grid gap-4 sm:grid-cols-3 sm:gap-0">
        {SETTLEMENT_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5">
            <div className="flex items-center sm:w-full">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                {index + 1}
              </span>
              {index < SETTLEMENT_STEPS.length - 1 && (
                <span aria-hidden className="mx-2 hidden h-px flex-1 bg-border sm:block" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-1.5">
              <p className="text-sm font-semibold">{step}</p>
              {/* ponytail: nothing moves these along yet. They need live status from the backend. */}
              <Badge className="h-6 rounded-full bg-warning/15 px-2.5 text-warning">Pending</Badge>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
