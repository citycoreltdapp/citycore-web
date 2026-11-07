"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSupportStateSchema } from "@/constant/schemas/admin-support";
import { Add01Icon, ArrowDataTransferHorizontalIcon, Ticket01Icon, UserCheck01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { SUPPORT_DEFAULTS } from "../_operations/workspace-data";
import { FilterChips, StatusPill, formatDate } from "../account/_ui";
import { ageLabel } from "../kyc/_ui";
import { NewTicketSheet } from "./_new-ticket";
import { CATEGORY_LABEL, TICKET_STATUS, type Ticket, TicketThread } from "./_thread";

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
    else if (n.target === "verification") router.push(`/kyc/review?investor=${encodeURIComponent(n.reference)}`);
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
            render={<Link href="/settings/notifications" />}
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

export function AdminSupportPage() {
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
