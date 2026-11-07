"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ledgerMappingSchema, postingPreviewFormSchema } from "@/constant/schemas/admin-treasury";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LEDGER_MAPPINGS } from "../../_operations/treasury-data";
import { FinanceNumber, FinanceText, money } from "../../_operations/treasury-ui";
import { StatusPill } from "../../account/_ui";
import { CardHeader } from "../../content/_ui";
import { CheckMark } from "../../kyc/_ui";

type Mapping = (typeof LEDGER_MAPPINGS)[number];
type Posting = z.infer<typeof postingPreviewFormSchema>;

function Account({ side, name }: { side: "Dr" | "Cr"; name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      <span
        className={cn(
          "flex h-5 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
          side === "Dr" ? "bg-foreground text-background" : "bg-accent/20 text-foreground"
        )}
      >
        {side}
      </span>
      <span className="min-w-0">{name}</span>
    </span>
  );
}

function PostingPreview({ mapping }: { mapping: Mapping }) {
  const form = useForm<Posting>({
    resolver: zodResolver(postingPreviewFormSchema),
    defaultValues: { reference: "CC-1022", amount: 250000 },
  });
  const [validated, setValidated] = React.useState<(Posting & { mapping: Mapping }) | null>(null);
  const result = validated?.mapping.id === mapping.id ? validated : null;

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8 xl:sticky xl:top-24">
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => {
          if (!z.array(ledgerMappingSchema).safeParse(LEDGER_MAPPINGS).success) {
            toast.error("Invalid mapping. Debit and credit accounts must differ.");
            return;
          }
          setValidated({ ...values, mapping });
        })}
      >
        <div className="flex flex-col gap-4 p-5">
          <CardHeader title="Posting preview" note={`${mapping.event} · never posts to the ledger`} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <FinanceText form={form} name="reference" label="Posting reference" />
            <FinanceNumber form={form} name="amount" label="Amount" prefix="₦" />
          </div>
        </div>
        {result && (
          <div role="status" className="flex flex-col gap-3 border-t border-border p-5">
            <ul className="flex flex-col gap-2">
              {[
                { side: "Dr" as const, name: result.mapping.debitAccount },
                { side: "Cr" as const, name: result.mapping.creditAccount },
              ].map((line) => (
                <li key={line.side} className="flex items-center justify-between gap-3">
                  <Account side={line.side} name={line.name} />
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{money(result.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
              <CheckMark ok label={`Balanced · difference ${money(0)}`} />
              <span className="text-xs text-muted-foreground">{result.reference}</span>
            </div>
          </div>
        )}
        <div className="border-t border-border bg-muted/40 p-5">
          <Button type="submit" variant="outline" className="h-10 w-full rounded-full">
            Validate posting
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function LedgerTab() {
  const [selected, setSelected] = React.useState(LEDGER_MAPPINGS[0].id);
  const mapping = LEDGER_MAPPINGS.find((m) => m.id === selected) ?? LEDGER_MAPPINGS[0];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Chart-of-accounts mapping" note="Double entry · select an event to preview its posting">
          <StatusPill tone="muted">Draft</StatusPill>
        </CardHeader>
        <ul className="flex flex-col gap-2">
          {LEDGER_MAPPINGS.map((m) => {
            const active = m.id === selected;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(m.id)}
                  className={cn(
                    "grid w-full gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] md:items-center",
                    active ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm font-semibold">{m.event}</span>
                  <Account side="Dr" name={m.debitAccount} />
                  <Account side="Cr" name={m.creditAccount} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Every event debits one account and credits another for the same amount. Debit and credit must differ.
        </p>
      </Card>
      <PostingPreview mapping={mapping} />
    </div>
  );
}
