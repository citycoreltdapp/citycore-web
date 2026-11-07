"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

import { BANKING_RETRIES } from "../../_operations/treasury-data";
import { StatusPill, type Tone } from "../../account/_ui";
import { CardHeader } from "../../content/_ui";
import { DetailList } from "../../users/_ui";

type Retry = (typeof BANKING_RETRIES)[number];
export const RETRY_STATE: Record<Retry["state"], { tone: Tone; label: string }> = {
  blocked: { tone: "danger", label: "Blocked" },
  "review-before-retry": { tone: "warning", label: "Verify" },
};

export function RetriesTab() {
  const [selectedId, setSelectedId] = React.useState(BANKING_RETRIES[0].id);
  const selected = BANKING_RETRIES.find((r) => r.id === selectedId) ?? BANKING_RETRIES[0];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Posting & sync retries" note="Illustrative failed records · no live retry available" />
        <ul className="flex flex-col gap-2">
          {BANKING_RETRIES.map((r) => {
            const active = r.id === selectedId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="w-20 shrink-0 font-mono text-xs font-semibold">{r.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.operation}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.failure} · next: {r.nextStep.toLowerCase()}
                    </span>
                  </span>
                  <StatusPill tone={RETRY_STATE[r.state].tone}>{RETRY_STATE[r.state].label}</StatusPill>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs/5 text-muted-foreground">
          Original references and idempotency keys must be preserved. A timeout doesn&apos;t prove the posting failed,
          so retries stay blocked until the original status is verified.
        </p>
      </Card>

      <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8 xl:sticky xl:top-24">
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title={selected.id} note={selected.operation}>
            <StatusPill tone={RETRY_STATE[selected.state].tone}>{RETRY_STATE[selected.state].label}</StatusPill>
          </CardHeader>
          <DetailList
            rows={[
              ["Failure", selected.failure],
              ["Next step", selected.nextStep],
              [
                "Original reference",
                <span key="ref" className="font-mono text-xs">
                  {selected.originalReference}
                </span>,
              ],
              [
                "Idempotency key",
                <span key="key" className="font-mono text-xs">
                  {selected.idempotencyKey}
                </span>,
              ],
            ]}
          />
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Masked payload</p>
            <pre className="overflow-x-auto rounded-xl bg-[#121212] p-4 text-xs/6 text-white/80">
              {JSON.stringify(
                {
                  reference: selected.originalReference,
                  operation: selected.operation,
                  idempotencyKey: selected.idempotencyKey,
                  environment: "sandbox",
                  state: selected.state,
                },
                null,
                2
              )}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              No credentials, full account numbers or identity numbers included.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-5">
          <Button variant="outline" className="h-10 rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Query original status
          </Button>
          <Button className="h-10 rounded-full" disabled>
            <HugeiconsIcon icon={LockIcon} aria-hidden />
            Retry idempotent posting
          </Button>
        </div>
      </Card>
    </div>
  );
}
