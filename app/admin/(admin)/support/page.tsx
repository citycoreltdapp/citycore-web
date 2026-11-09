"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  adminReplyFormSchema,
  adminSupportStateSchema,
  adminTicketFormSchema,
  type adminTicketSchema,
  supportAttachmentSchema,
} from "@/constant/schemas/admin-support";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Add01Icon,
  ArrowDataTransferHorizontalIcon,
  Attachment01Icon,
  Cancel01Icon,
  CustomerSupportIcon,
  SentIcon,
  Ticket01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceText } from "../_operations/treasury-ui";
import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { SUPPORT_DEFAULTS } from "../_operations/workspace-data";
import { FilterChips, StatusPill, formatDate, formatTime } from "../account/page";
import { ageLabel } from "../kyc/page";
import { openMediaPicker } from "../media/_library";
import { Initials } from "../users/page";

type Attachment = z.infer<typeof supportAttachmentSchema>;

// Evidence comes from the shared media library, so a file uploaded once can be attached anywhere.
function openUpload(files: Attachment[], onChange: (files: Attachment[]) => void) {
  openMediaPicker({
    title: "Attach evidence",
    accept: ["application/pdf", "image/png", "image/jpeg"],
    multiple: true,
    max: 5 - files.length,
    onSelect: (assets) => {
      const next = assets
        .map((asset) => supportAttachmentSchema.safeParse({ name: asset.name, size: asset.bytes, type: asset.type }))
        .flatMap((parsed) => (parsed.success ? [parsed.data] : []));
      onChange([...files, ...next].slice(0, 5));
    },
  });
}

function AttachButton({
  files,
  onChange,
  label = "Attach",
}: {
  files: Attachment[];
  onChange: (files: Attachment[]) => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 rounded-full px-3 text-muted-foreground"
      disabled={files.length >= 5}
      onClick={() => openUpload(files, onChange)}
    >
      <HugeiconsIcon icon={Attachment01Icon} aria-hidden />
      {label}
    </Button>
  );
}

function AttachmentChips({ files, onChange }: { files: Attachment[]; onChange?: (files: Attachment[]) => void }) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {files.map((file, i) => (
        <li
          key={`${file.name}-${i}`}
          className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs"
        >
          <HugeiconsIcon icon={Attachment01Icon} aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">{Math.ceil(file.size / 1024)} KB</span>
          {onChange && (
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onChange(files.filter((_, index) => index !== i))}
              className="-mr-1 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden className="size-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

type Ticket = z.infer<typeof adminTicketSchema>;

const TICKET_STATUS = {
  "in-progress": { label: "In progress", tone: "warning" },
  "awaiting-reply": { label: "Awaiting reply", tone: "muted" },
  resolved: { label: "Resolved", tone: "success" },
} as const;
const CATEGORY_LABEL: Record<Ticket["category"], string> = {
  transactions: "Transactions",
  verification: "Verification",
  account: "Account",
  other: "Other",
};

const LINKED: Record<string, [string, string][]> = {
  "T-208": [
    ["Recipient", "Ada Okafor · ••2048"],
    ["Requested debit", "₦100,000 · no fee"],
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

function TicketThread({ ticket, onSave }: { ticket: Ticket; onSave: (next: Ticket) => boolean }) {
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
          <li className="py-6 text-center text-sm text-muted-foreground">
            No replies yet. Start the conversation below.
          </li>
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

type TicketForm = z.infer<typeof adminTicketFormSchema>;
const DEFAULTS: TicketForm = { category: "transactions", transactionReference: "", subject: "", details: "" };

function NewTicketSheet({
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

type State = z.infer<typeof adminSupportStateSchema>;
type StatusFilter = "all" | Ticket["status"];
const NOTIFICATION_ICON = {
  verification: UserCheck01Icon,
  ticket: Ticket01Icon,
  transaction: ArrowDataTransferHorizontalIcon,
};

function QueueCard({ tickets, unread }: { tickets: Ticket[]; unread: number }) {
  const open = tickets.filter((t) => t.status !== "resolved");
  const oldest = open.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const groups = (["in-progress", "awaiting-reply", "resolved"] as const).map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  }));
  const colors = { "in-progress": "bg-accent", "awaiting-reply": "bg-white/40", resolved: "bg-white/15" };

  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Open tickets</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{open.length}</p>
        </div>
        {oldest && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            Oldest opened {ageLabel(oldest.createdAt).toLowerCase()}
          </span>
        )}
      </div>

      <div className="relative flex flex-col gap-2.5">
        <div aria-hidden className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/10">
          {groups
            .filter((g) => g.count)
            .map((g) => (
              <span
                key={g.status}
                className={cn("h-full rounded-full", colors[g.status])}
                style={{ flexGrow: g.count }}
              />
            ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {groups.map((g) => (
            <p key={g.status} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-2 rounded-full", colors[g.status])} />
              <span className="text-white/60">{TICKET_STATUS[g.status].label}</span>
              <span className="font-semibold tabular-nums">{g.count}</span>
            </p>
          ))}
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          {
            label: "Disputes",
            value: open.filter((t) => t.category === "transactions").length,
            note: "linked to money",
          },
          { label: "Unread alerts", value: unread, note: "in the alert feed" },
          { label: "Total tickets", value: tickets.length, note: "this workspace" },
        ].map(({ label, value, note }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-white/60">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
            <dd className="truncate text-xs text-white/50">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AlertsCard({
  value,
  save,
  onOpenTicket,
}: {
  value: State;
  save: (v: State) => boolean;
  onOpenTicket: (id: string) => void;
}) {
  const router = useRouter();
  const unread = value.notifications.filter((n) => !n.isRead).length;
  const open = (n: State["notifications"][number]) => {
    save({ ...value, notifications: value.notifications.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)) });
    if (n.target === "ticket") onOpenTicket(n.reference);
    else if (n.target === "verification") router.push(`/admin/kyc/review?investor=${encodeURIComponent(n.reference)}`);
    else
      AppModal.open({
        title: n.title,
        description: n.reference,
        content: (
          <Notice>
            {n.body} This is an illustrative alert, not a verified ledger record. Check treasury and reconciliation
            before any retry.
          </Notice>
        ),
      });
  };

  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Alerts</h2>
          <p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : "All caught up"}</p>
        </div>
        <button
          type="button"
          disabled={!unread}
          onClick={() => save({ ...value, notifications: value.notifications.map((n) => ({ ...n, isRead: true })) })}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:hover:text-muted-foreground"
        >
          Mark all read
        </button>
      </div>
      <ul className="flex flex-col">
        {value.notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  n.isRead ? "bg-muted text-muted-foreground" : "bg-accent/20 text-foreground"
                )}
              >
                <HugeiconsIcon icon={NOTIFICATION_ICON[n.target]} aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", n.isRead ? "text-muted-foreground" : "font-semibold")}>
                  {n.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
              </span>
              {!n.isRead && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent">
                  <span className="sr-only">Unread</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SupportWorkspace({ value, save }: { value: State; save: (v: State) => boolean }) {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(value.tickets[0]?.id ?? "");
  const [creating, setCreating] = React.useState(false);

  const term = search.trim().toLowerCase();
  const rows = value.tickets
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => !term || `${t.id} ${t.subject} ${t.transactionReference}`.toLowerCase().includes(term));
  const ticket = value.tickets.find((t) => t.id === selectedId) ?? value.tickets[0];
  const countOf = (s: StatusFilter) => value.tickets.filter((t) => s === "all" || t.status === s).length;
  const unread = value.notifications.filter((n) => !n.isRead).length;

  const openTicket = (id: string) => {
    setStatus("all");
    setSearch("");
    setSelectedId(id);
    document.getElementById("support-inbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Investor tickets and account alerts · conversations stay in this browser
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/admin/settings/notifications" />}
          >
            Alert settings
          </Button>
          <Button className="h-10 rounded-full px-4" onClick={() => setCreating(true)}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden />
            New ticket
          </Button>
        </div>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <QueueCard tickets={value.tickets} unread={unread} />
        <AlertsCard value={value} save={save} onOpenTicket={openTicket} />
      </div>

      <Card
        id="support-inbox"
        className="scroll-mt-24 gap-0 overflow-hidden rounded-2xl py-0 ring-foreground/8 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]"
      >
        <div className="flex min-w-0 flex-col gap-3 border-b border-border p-5 lg:border-r lg:border-b-0">
          <div>
            <h2 className="text-base font-semibold">Inbox</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {rows.length} of {value.tickets.length} tickets
            </p>
          </div>
          <FilterChips
            label="Ticket status"
            value={status}
            onChange={setStatus}
            options={(["all", "in-progress", "awaiting-reply", "resolved"] as const).map((s) => ({
              value: s,
              label: s === "all" ? "All" : TICKET_STATUS[s].label,
              count: countOf(s),
            }))}
          />
          <SearchField
            id="support-ticket-search"
            value={search}
            onChange={setSearch}
            placeholder="Search ticket or reference"
            groupClassName="h-9 bg-card dark:bg-card"
          />
          <ul className="-mx-2 flex flex-col gap-1">
            {rows.map((t) => {
              const active = t.id === ticket?.id;
              const last = t.messages.at(-1);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-xl px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{t.subject}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{last?.body ?? t.details}</span>
                    <span className="flex items-center gap-2">
                      <StatusPill tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</StatusPill>
                      <span className="text-xs text-muted-foreground">
                        {t.id} · {CATEGORY_LABEL[t.category]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {!rows.length && (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">No tickets match these filters.</li>
            )}
          </ul>
        </div>

        {ticket ? (
          <TicketThread
            key={ticket.id}
            ticket={ticket}
            onSave={(next) => save({ ...value, tickets: value.tickets.map((t) => (t.id === next.id ? next : t)) })}
          />
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
            Select a ticket to read the conversation.
          </div>
        )}
      </Card>

      <NewTicketSheet
        open={creating}
        onOpenChange={setCreating}
        onCreate={(next) => {
          if (!save({ ...value, tickets: [next, ...value.tickets] })) return false;
          setCreating(false);
          openTicket(next.id);
          toast.success("Ticket saved locally. No support request was sent.");
          return true;
        }}
      />
    </>
  );
}

export default function AdminSupportPage() {
  const store = usePreviewState("citycore-admin-support-v1", adminSupportStateSchema, SUPPORT_DEFAULTS);
  if (!store.ready)
    return (
      <>
        <Skeleton className="h-14 w-72 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-[32rem] rounded-2xl" />
      </>
    );
  return <SupportWorkspace value={store.value} save={store.save} />;
}
