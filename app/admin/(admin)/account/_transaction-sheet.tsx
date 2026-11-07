"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminAccountTransaction } from "@/constant/schemas/admin-account";
import { ArrowDownLeft01Icon, ArrowUpRight01Icon, Copy01Icon, Invoice01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { toast } from "sonner";

import { money } from "./_data";
import { openInvoice } from "./_invoice-preview";
import { useAccount } from "./_store";
import { StatusPill, TRANSACTION_TONES, formatDate, formatTime } from "./_ui";

export function TransactionSheet({
  transaction,
  onClose,
}: {
  transaction: AdminAccountTransaction | null;
  onClose: () => void;
}) {
  const { invoices } = useAccount();
  const invoice = transaction && invoices.find((item) => item.invoiceNumber === transaction.invoiceNumber);
  const isCredit = transaction?.direction === "credit";

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        {transaction && (
          <>
            <SheetHeader className="gap-1 border-b border-border p-6">
              <span
                className={cn(
                  "mb-3 flex size-11 items-center justify-center rounded-full",
                  isCredit ? "bg-success/12 text-success" : "bg-muted text-foreground"
                )}
              >
                <HugeiconsIcon icon={isCredit ? ArrowDownLeft01Icon : ArrowUpRight01Icon} aria-hidden />
              </span>
              <SheetTitle className="text-base font-semibold">{transaction.title}</SheetTitle>
              <SheetDescription>
                {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
              </SheetDescription>
              <p className={cn("mt-3 text-3xl font-light tabular-nums", isCredit && "text-success")}>
                {isCredit ? "+" : "−"}
                {money(transaction.amount)}
              </p>
              <div className="mt-2">
                <StatusPill tone={TRANSACTION_TONES[transaction.status]}>{transaction.status}</StatusPill>
              </div>
            </SheetHeader>

            <dl className="flex flex-col p-6 text-sm">
              {[
                ["Direction", isCredit ? "Money in" : "Money out"],
                ["Medium", transaction.medium],
                ["Invoice", `#${transaction.invoiceNumber}`],
                ["Reference", transaction.id],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-border py-3 last:border-none">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-border p-6">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() =>
                  navigator.clipboard
                    .writeText(transaction.id)
                    .then(() => toast.success("Reference copied."))
                    .catch(() => toast.error("Clipboard access is unavailable."))
                }
              >
                <HugeiconsIcon icon={Copy01Icon} aria-hidden />
                Copy reference
              </Button>
              {invoice && (
                <Button
                  className="flex-1 rounded-full"
                  onClick={() => {
                    onClose();
                    openInvoice(invoice);
                  }}
                >
                  <HugeiconsIcon icon={Invoice01Icon} aria-hidden />
                  Open invoice
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
