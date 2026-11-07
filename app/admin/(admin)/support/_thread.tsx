"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminReplyFormSchema, type adminTicketSchema } from "@/constant/schemas/admin-support";
import { zodResolver } from "@hookform/resolvers/zod";
import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { StatusPill, formatDate, formatTime } from "../account/_ui";
import { Initials } from "../users/_ui";
import { AttachButton, type Attachment, AttachmentChips } from "./_attachments";

export type Ticket = z.infer<typeof adminTicketSchema>;

export const TICKET_STATUS = {
  "in-progress": { label: "In progress", tone: "warning" },
  "awaiting-reply": { label: "Awaiting reply", tone: "muted" },
  resolved: { label: "Resolved", tone: "success" },
} as const;
export const CATEGORY_LABEL: Record<Ticket["category"], string> = {
  transactions: "Transactions",
  verification: "Verification",
  account: "Account",
  other: "Other",
};

// ponytail: recipient and debit details are sample data until the ticket API returns the linked transaction.
const LINKED: Record<string, [string, string][]> = {
  "T-208": [
    ["Recipient", "Ada Okafor · ••2048"],
    ["Requested debit", "₦100,050 incl. ₦50 fee"],
    ["Transaction state", "Failed · in reconciliation"],
  ],
};
const SUGGESTED = [
  {
    label: "Withdrawal timelines",
    body: "We're checking the original settlement status with the bank before anything is retried. Please don't resubmit the transfer in the meantime; we'll update this ticket as soon as we have the bank's response.",
  },
  {
    label: "How reversals work",
    body: "If the bank confirms the transfer didn't settle, the amount is reversed to your City Core wallet. Reversal timing depends on the provider. We'll confirm here once it's posted.",
  },
];
const isStaff = (author: string) => author === "Support" || author === "Admin preview";

function Message({
  author,
  body,
  createdAt,
  attachments,
  note,
}: {
  author: string;
  body: string;
  createdAt: string;
  attachments: Attachment[];
  note?: string;
}) {
  const staff = isStaff(author);
  return (
    <li className={cn("flex gap-3", staff && "flex-row-reverse")}>
      <Initials name={author} size="sm" className="mt-5" />
      <div className={cn("flex max-w-[85%] min-w-0 flex-col gap-1.5", staff && "items-end")}>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{author}</span> · {formatDate(createdAt)},{" "}
          {formatTime(createdAt)}
          {note && <span> · {note}</span>}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm/6 whitespace-pre-wrap",
            staff ? "rounded-tr-md bg-foreground text-background" : "rounded-tl-md bg-muted"
          )}
        >
          {body}
        </div>
        <AttachmentChips files={attachments} />
      </div>
    </li>
  );
}

export function TicketThread({ ticket, onSave }: { ticket: Ticket; onSave: (next: Ticket) => boolean }) {
  const form = useForm<z.infer<typeof adminReplyFormSchema>>({
    resolver: zodResolver(adminReplyFormSchema),
    defaultValues: { message: "" },
  });
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const status = TICKET_STATUS[ticket.status];
  const resolved = ticket.status === "resolved";
  const linked = LINKED[ticket.id];

  const send = form.handleSubmit((v) => {
    const saved = onSave({
      ...ticket,
      status: "awaiting-reply",
      messages: [
        ...ticket.messages,
        {
          id: crypto.randomUUID(),
          author: "Admin preview",
          body: v.message,
          createdAt: new Date().toISOString(),
          local: true,
          attachments: files,
        },
      ],
    });
    if (saved) {
      form.reset();
      setFiles([]);
      toast.success("Reply saved locally. Nothing was sent to the investor.");
    }
  });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-4 border-b border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{ticket.subject}</h2>
            <p className="text-xs text-muted-foreground">
              {ticket.id} · {CATEGORY_LABEL[ticket.category]} · opened {formatDate(ticket.createdAt)}
            </p>
            <p className="mt-2 text-sm/6 text-muted-foreground">{ticket.details}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                if (onSave({ ...ticket, status: resolved ? "in-progress" : "resolved" }))
                  toast.success(resolved ? "Ticket reopened" : "Ticket marked resolved");
              }}
            >
              {resolved ? "Reopen" : "Mark resolved"}
            </Button>
          </div>
        </div>
        {(ticket.transactionReference || linked) && (
          <dl className="grid gap-4 rounded-xl bg-muted/50 p-4 sm:grid-cols-4">
            {[
              ["Linked transaction", ticket.transactionReference || "Not linked"] as [string, string],
              ...(linked ?? []),
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <ol className="flex flex-col gap-5 p-5">
        {!ticket.messages.length && (
          <li className="py-6 text-center text-sm text-muted-foreground">No replies yet. Start the conversation below.</li>
        )}
        {ticket.messages.map((m) => (
          <Message
            key={m.id}
            author={m.author}
            body={m.body}
            createdAt={m.createdAt}
            attachments={m.attachments}
            note={m.local ? "saved locally" : undefined}
          />
        ))}
      </ol>

      <form noValidate onSubmit={send} className="mt-auto flex flex-col gap-3 border-t border-border p-5">
        {!resolved && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">Suggested</span>
            {SUGGESTED.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => form.setValue("message", s.body, { shouldValidate: true })}
                className="h-7 rounded-full border border-border px-3 text-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <div className="rounded-2xl border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <Textarea
                {...field}
                aria-label="Reply"
                aria-invalid={!!fieldState.error}
                disabled={resolved}
                placeholder={resolved ? "Reopen the ticket to reply" : "Write a reply…"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                }}
                className="min-h-24 border-none bg-transparent px-4 pt-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
                <AttachButton files={files} onChange={setFiles} />
                <span className="ml-auto hidden text-xs text-muted-foreground sm:block">⌘ + Enter to send</span>
                <Button type="submit" className="h-9 rounded-full px-4" disabled={resolved}>
                  <HugeiconsIcon icon={SentIcon} aria-hidden />
                  Send
                </Button>
              </div>
              {fieldState.error && <p className="px-4 pb-3 text-xs text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <AttachmentChips files={files} onChange={setFiles} />
        <p className="text-xs text-muted-foreground">
          Replies stay in this browser. Support never asks for a password, PIN or authenticator code.
        </p>
      </form>
    </div>
  );
}
