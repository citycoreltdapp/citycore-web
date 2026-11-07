"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminTicketFormSchema } from "@/constant/schemas/admin-support";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerSupportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { FinanceText } from "../_operations/treasury-ui";
import { AttachButton, type Attachment, AttachmentChips } from "./_attachments";
import { CATEGORY_LABEL, type Ticket } from "./_thread";

type TicketForm = z.infer<typeof adminTicketFormSchema>;
const DEFAULTS: TicketForm = { category: "transactions", transactionReference: "", subject: "", details: "" };

export function NewTicketSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (ticket: Ticket) => boolean;
}) {
  const form = useForm<TicketForm>({ resolver: zodResolver(adminTicketFormSchema), defaultValues: DEFAULTS });
  const [files, setFiles] = React.useState<Attachment[]>([]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="gap-2 border-b border-border p-6">
          <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
            <HugeiconsIcon icon={CustomerSupportIcon} aria-hidden />
          </span>
          <SheetTitle className="text-base font-semibold">New support ticket</SheetTitle>
          <SheetDescription>Log an investor issue · saved in this browser only</SheetDescription>
        </SheetHeader>
        <form
          noValidate
          className="flex flex-col gap-5 p-6"
          onSubmit={form.handleSubmit((v) => {
            const createdAt = new Date().toISOString();
            const created = onCreate({
              ...v,
              id: `T-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
              status: "in-progress",
              createdAt,
              messages: files.length
                ? [
                    {
                      id: crypto.randomUUID(),
                      author: "Admin preview",
                      body: "Evidence attached to the original request.",
                      createdAt,
                      local: true,
                      attachments: files,
                    },
                  ]
                : [],
            });
            if (created) {
              form.reset(DEFAULTS);
              setFiles([]);
            }
          })}
        >
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Category</legend>
                <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(CATEGORY_LABEL) as TicketForm["category"][]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={field.value === value}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        field.value === value
                          ? "border-foreground/30 bg-muted font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {CATEGORY_LABEL[value]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          />
          <FinanceText form={form} name="subject" label="Subject" />
          <FinanceText form={form} name="transactionReference" label="Linked transaction (optional)" />
          <FinanceText form={form} name="details" label="What happened?" area />
          <div className="flex flex-col gap-2">
            <div>
              <AttachButton files={files} onChange={setFiles} label="Attach evidence" />
            </div>
            <AttachmentChips files={files} onChange={setFiles} />
          </div>
          <div className="flex gap-2 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 flex-1 rounded-full">
              Create ticket
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
