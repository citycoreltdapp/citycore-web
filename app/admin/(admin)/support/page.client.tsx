"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminReplyFormSchema,
  adminSupportStateSchema,
  adminTicketFormSchema,
  adminTicketSchema,
} from "@/constant/schemas/admin-support";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FinanceSelect, FinanceText } from "../_operations/treasury-ui";
import { Notice, PageLink, PageTitle, Panel, StatusBadge } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { SUPPORT_DEFAULTS } from "../_operations/workspace-data";
import { type Attachment, AttachmentControl } from "./_attachments";

type State = z.infer<typeof adminSupportStateSchema>;
type Ticket = z.infer<typeof adminTicketSchema>;
export function AdminSupportPage() {
  const store = usePreviewState("citycore-admin-support-v1", adminSupportStateSchema, SUPPORT_DEFAULTS);
  return (
    <>
      <PageTitle
        title="Support & Notifications"
        description="Track investor issues, linked transactions and important account updates."
      >
        <PageLink href="/settings/notifications">Notification settings</PageLink>
      </PageTitle>
      {!store.ready ? <Skeleton className="h-96" /> : <SupportWorkspace value={store.value} save={store.save} />}
    </>
  );
}
function SupportWorkspace({ value, save }: { value: State; save: (v: State) => boolean }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState("T-208");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const ticket = value.tickets.find((t) => t.id === selectedId) ?? value.tickets[0];
  const create = useForm<z.infer<typeof adminTicketFormSchema>>({
    resolver: zodResolver(adminTicketFormSchema),
    defaultValues: { category: "transactions", transactionReference: "CC-1018", subject: "", details: "" },
  });
  const filtered = value.tickets.filter((t) => `${t.id} ${t.subject}`.toLowerCase().includes(search.toLowerCase()));
  const unread = value.notifications.filter((n) => !n.isRead).length;
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <Panel
          title="Your tickets"
          description={`${value.tickets.filter((t) => t.status !== "resolved").length} open · illustrative conversations`}
        >
          <SearchField
            id="support-ticket-search"
            value={search}
            onChange={setSearch}
            placeholder="Reference or subject"
          />
          <div className="space-y-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === ticket.id}
                className={`w-full cursor-pointer rounded-xl p-3 text-left transition-colors hover:bg-muted ${t.id === ticket.id ? "bg-muted" : "bg-muted/30"}`}
                onClick={() => setSelectedId(t.id)}
              >
                <p className="text-sm font-medium">
                  {t.id} · {t.subject}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.status.replaceAll("-", " ")} · {t.createdAt.slice(0, 10)}
                </p>
              </button>
            ))}
            {!filtered.length && <p className="text-sm text-muted-foreground">No matching tickets.</p>}
          </div>
          <Button onClick={() => create.setFocus("subject")}>New support ticket</Button>
        </Panel>
        <Panel title="Create a ticket">
          <form
            noValidate
            className="space-y-4"
            onSubmit={create.handleSubmit((v) => {
              const id = `T-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
              const createdAt = new Date().toISOString();
              const next: Ticket = {
                ...v,
                id,
                status: "in-progress",
                createdAt,
                messages: [
                  {
                    id: crypto.randomUUID(),
                    author: "Admin preview",
                    body: v.details,
                    createdAt,
                    local: true,
                    attachments,
                  },
                ],
              };
              if (save({ ...value, tickets: [next, ...value.tickets] })) {
                setSelectedId(id);
                create.reset();
                setAttachments([]);
                toast.success("Ticket saved locally. No support request was sent.");
              }
            })}
          >
            <FinanceSelect
              form={create}
              name="category"
              label="Category"
              items={[
                { value: "transactions", label: "Transactions / dispute" },
                { value: "verification", label: "Verification" },
                { value: "account", label: "Account" },
                { value: "other", label: "Other" },
              ]}
            />
            <FinanceText form={create} name="transactionReference" label="Linked transaction" />
            <FinanceText form={create} name="subject" label="Subject" />
            <FinanceText form={create} name="details" label="Details" area />
            <AttachmentControl files={attachments} onChange={setAttachments} label="Attach evidence" />
            <Button type="submit">Submit ticket</Button>
          </form>
        </Panel>
      </aside>
      <div className="space-y-5">
        <TicketThread
          key={ticket.id}
          ticket={ticket}
          onSave={(next) => save({ ...value, tickets: value.tickets.map((t) => (t.id === next.id ? next : t)) })}
        />
        <Panel title="Notification center" description={`${unread} unread · local preview state`}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                save({ ...value, notifications: value.notifications.map((n) => ({ ...n, isRead: true })) })
              }
            >
              Mark all as read
            </Button>
            <PageLink href="/settings/notifications">Notification settings</PageLink>
          </div>
          <div className="space-y-3">
            {value.notifications.map((n) => (
              <button
                type="button"
                key={n.id}
                className="w-full cursor-pointer rounded-xl bg-muted/40 p-4 text-left hover:bg-muted"
                onClick={() => {
                  save({
                    ...value,
                    notifications: value.notifications.map((item) =>
                      item.id === n.id ? { ...item, isRead: true } : item
                    ),
                  });
                  if (n.target === "ticket") setSelectedId(n.reference);
                  else if (n.target === "verification")
                    router.push(`/kyc/review?investor=${encodeURIComponent(n.reference)}`);
                  else
                    AppModal.open({
                      title: `Transaction · ${n.reference}`,
                      content: (
                        <Notice>
                          {n.body} This is an illustrative notification, not a verified ledger record. Review the
                          treasury and reconciliation services before any retry.
                        </Notice>
                      ),
                    });
                }}
              >
                <p className="text-sm font-medium">
                  {n.isRead ? "" : "● "}
                  {n.title}
                </p>
                <p className="mt-1 text-xs/5 text-muted-foreground">{n.body}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
function TicketThread({ ticket, onSave }: { ticket: Ticket; onSave: (next: Ticket) => boolean }) {
  const form = useForm({ resolver: zodResolver(adminReplyFormSchema), defaultValues: { message: "" } });
  const [files, setFiles] = React.useState<Attachment[]>([]);
  return (
    <Panel title={`${ticket.subject} · ${ticket.id}`} description="City Core support · preview conversation">
      <StatusBadge value={ticket.status} />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt>Linked transaction</dt>
        <dd>{ticket.transactionReference || "Not linked"}</dd>
        <dt>Recipient</dt>
        <dd>{ticket.id === "T-208" ? "Ada Okafor · Demo Bank ••2048" : "Masked investor reference"}</dd>
        {ticket.id === "T-208" && (
          <>
            <dt>Requested debit</dt>
            <dd>₦100,050 including ₦50 fee</dd>
            <dt>Transaction state</dt>
            <dd>Failed · reconciliation review</dd>
          </>
        )}
      </dl>
      <div className="space-y-3">
        {ticket.messages.map((message) => (
          <article key={message.id} className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs font-medium">
              {message.author} · {message.createdAt.slice(0, 16).replace("T", " ")} UTC{" "}
              {message.local ? "· local preview" : ""}
            </p>
            <p className="mt-2 text-sm/6 whitespace-pre-wrap">{message.body}</p>
            {message.attachments.map((file, i) => (
              <p key={i} className="mt-2 text-xs text-muted-foreground">
                Attachment metadata: {file.name}
              </p>
            ))}
          </article>
        ))}
        {!ticket.messages.length && <Notice>No conversation messages yet.</Notice>}
      </div>
      <div className="flex flex-wrap gap-2">
        {["Withdrawal timelines", "How reversals work"].map((topic) => (
          <Button
            key={topic}
            variant="outline"
            onClick={() =>
              AppModal.open({
                title: topic,
                content: (
                  <Notice>
                    Check the original settlement status before retrying a failed or timed-out withdrawal. Reversal
                    timing depends on the provider. No bank transfer is triggered by a support reply.
                  </Notice>
                ),
              })
            }
          >
            {topic}
          </Button>
        ))}
      </div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          if (
            onSave({
              ...ticket,
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
            })
          ) {
            form.reset();
            setFiles([]);
            toast.success("Reply saved locally. No message was sent externally.");
          }
        })}
      >
        <FinanceText form={form} name="message" label="Reply to support" area />
        <AttachmentControl files={files} onChange={setFiles} />
        <Button type="submit" disabled={ticket.status === "resolved"}>
          Send reply
        </Button>
      </form>
      <Notice>
        Conversation previews remain in this browser. Support will never request your password, PIN or authenticator
        code.
      </Notice>
    </Panel>
  );
}
