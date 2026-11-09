"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type BirthdayPerson,
  type ComposeEmailForm,
  EMAIL_KIND_META,
  type EmailDesk,
  type EmailLogEntry,
  type InHouseMessage,
  emailDeskSchema,
  emailGroupSchema,
} from "@/constant/schemas/admin-mail";
import { MAIL_AS_OF, MAX_EMAIL_ATTEMPTS, emailDecision, nextBirthdaySend } from "@/lib/mail-preview";
import {
  Add01Icon,
  BirthdayCakeIcon,
  CheckmarkBadge01Icon,
  CustomerSupportIcon,
  KeyIcon,
  Mail01Icon,
  Megaphone01Icon,
  MoneyBag02Icon,
  SecurityCheckIcon,
  UserAccountIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "cn";
import { toast } from "sonner";

import { STAFF } from "../_operations/data";
import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips, SegmentBar, StatusPill, type Tone, formatDate, formatTime } from "../account/page";
import { CardHeader } from "../content/page";
import { Initials } from "../users/page";
import { type Recipient, deliveryFor, mergeName, openComposer } from "./_composer";
import { EMAIL_DESK } from "./_data";

const STATUS_TONE = { queued: "warning", sent: "success", failed: "danger", skipped: "muted" } as const;
const STATUS_BAR = {
  sent: "bg-accent",
  queued: "bg-white/60",
  failed: "bg-destructive",
  skipped: "bg-white/25",
} as const;
const STATUSES = ["sent", "queued", "failed", "skipped"] as const;
const GROUPS = ["all", ...emailGroupSchema.options] as const;
const GROUP_META: Record<(typeof GROUPS)[number], { label: string; icon: IconSvgElement }> = {
  all: { label: "All", icon: Mail01Icon },
  "in-house": { label: "In-house", icon: Megaphone01Icon },
  account: { label: "Account", icon: UserAccountIcon },
  codes: { label: "Codes", icon: KeyIcon },
  money: { label: "Money", icon: MoneyBag02Icon },
  kyc: { label: "KYC", icon: SecurityCheckIcon },
  helpdesk: { label: "Helpdesk", icon: CustomerSupportIcon },
  birthday: { label: "Birthday", icon: BirthdayCakeIcon },
  staff: { label: "Staff", icon: UserMultipleIcon },
};
// ponytail: the signed-in admin until auth is wired; matches the reviewer used elsewhere in admin.
const SENDER = STAFF.find((s) => s.id === "staff-nneka")?.name ?? "City Core admin";

const sentThisYear = (log: EmailLogEntry[], userId: string) =>
  log.some(
    (row) =>
      row.kind === "birthday" &&
      row.userId === userId &&
      row.status === "sent" &&
      row.createdAt.startsWith(MAIL_AS_OF.slice(0, 4))
  );

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const stamp = () => `${MAIL_AS_OF}T${new Date().toISOString().slice(11, 19)}Z`;

function MessagesCard({ messages, onCompose }: { messages: InHouseMessage[]; onCompose: () => void }) {
  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="In-house messages" note="Memos to staff and announcements to investors">
        <Button variant="ghost" className="h-8 rounded-full px-3 text-xs" onClick={onCompose}>
          <HugeiconsIcon icon={Add01Icon} aria-hidden />
          New
        </Button>
      </CardHeader>
      {messages.length ? (
        <ul className="flex flex-col">
          {messages.slice(0, 4).map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() =>
                  AppModal.open({
                    title: message.subject,
                    description: `${message.audience === "staff" ? "Staff memo" : "Announcement"} · sent by ${
                      message.sentBy
                    } on ${formatDate(message.createdAt)}`,
                    content: (
                      <div className="flex flex-col gap-4">
                        <p className="text-sm/7 whitespace-pre-line">{mergeName(message.body, "there")}</p>
                        <p className="text-xs text-muted-foreground">
                          To {message.recipientLabel.toLowerCase()} · {message.delivered} delivered · {message.skipped}{" "}
                          skipped{message.required ? " · required notice" : ""}
                        </p>
                      </div>
                    ),
                    secondaryButton: { children: "Close" },
                  })
                }
                className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    message.audience === "staff" ? "bg-foreground text-background" : "bg-accent/20 text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={message.audience === "staff" ? UserMultipleIcon : Megaphone01Icon}
                    aria-hidden
                    className="size-4"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{message.subject}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {message.audience === "staff" ? "Staff" : "Investors"} · {message.delivered} delivered
                    {message.skipped ? ` · ${message.skipped} skipped` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {formatDate(message.createdAt).split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Megaphone01Icon} aria-hidden className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">Nothing sent in-house yet.</p>
          <Button className="h-9 rounded-full px-4" onClick={onCompose}>
            Write a message
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function EmailsPage() {
  const desk = usePreviewState("citycore.admin.email", emailDeskSchema, EMAIL_DESK);
  const [group, setGroup] = React.useState<(typeof GROUPS)[number]>("all");
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState<EmailDesk["settings"] | null>(null);
  const settings = draft ?? desk.value.settings;
  const log = desk.value.log;

  const saveDesk = (next: EmailDesk, message: string) => {
    if (!desk.save(next)) return false;
    toast.success(message);
    return true;
  };
  const append = (row: EmailLogEntry, message: string) => saveDesk({ ...desk.value, log: [row, ...log] }, message);

  const optOuts = new Set(desk.value.people.filter((p) => !p.emailOptIn).map((p) => p.userId));

  const send = (form: ComposeEmailForm, recipients: Recipient[]) => {
    if (!recipients.length) {
      toast.error("No one to send to");
      return false;
    }
    const id = newId("IH");
    const createdAt = stamp();
    const rows: EmailLogEntry[] = recipients.map((person, index) => {
      const result = deliveryFor(person, form.required);
      return {
        id: `${id}-${index}`,
        kind: form.audience === "staff" ? "staff-memo" : "announcement",
        userId: person.id,
        toName: person.name,
        toEmail: person.email,
        status: result.status,
        attempts: 1,
        createdAt,
        detail: `${form.subject} · ${result.detail}`.slice(0, 500),
      };
    });
    const delivered = rows.filter((row) => row.status === "sent").length;
    const message: InHouseMessage = {
      id,
      audience: form.audience,
      subject: form.subject,
      body: form.body,
      required: form.required,
      recipientLabel: form.recipientMode === "everyone" ? "Everyone" : `${recipients.length} people`,
      delivered,
      skipped: rows.length - delivered,
      sentBy: SENDER,
      createdAt,
    };
    return saveDesk(
      { ...desk.value, messages: [message, ...desk.value.messages], log: [...rows, ...log] },
      rows.length === delivered
        ? `Sent to ${delivered} ${delivered === 1 ? "person" : "people"}`
        : `Sent to ${delivered} · ${rows.length - delivered} skipped`
    );
  };
  const compose = () => openComposer({ optOuts, sender: SENDER, onSend: send });

  const sendBirthday = (person: BirthdayPerson) => {
    const decision = emailDecision({
      security: false,
      emailOptIn: person.emailOptIn,
      birthdayAlreadySent: sentThisYear(log, person.userId),
    });
    append(
      {
        id: newId("EM"),
        kind: "birthday",
        userId: person.userId,
        toName: person.name,
        toEmail: person.email,
        status: decision.status === "queued" ? "sent" : "skipped",
        attempts: 1,
        createdAt: `${MAIL_AS_OF}T${desk.value.settings.sendTime}:00+01:00`,
        detail: decision.status === "queued" ? "Preview queue delivered this message" : decision.detail,
      },
      decision.status === "queued" ? `Birthday email sent to ${person.name}` : decision.detail
    );
  };

  const count = (status: EmailLogEntry["status"]) => log.filter((row) => row.status === status).length;
  const attempted = count("sent") + count("failed");
  const deliveryRate = attempted ? Math.round((count("sent") / attempted) * 100) : 100;
  const term = search.trim().toLowerCase();
  const rows = log
    .filter((row) => group === "all" || EMAIL_KIND_META[row.kind].group === group)
    .filter((row) => !term || `${row.toName} ${row.toEmail} ${row.id} ${row.detail}`.toLowerCase().includes(term))
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const upcoming = desk.value.people
    .map((person) => ({ person, when: nextBirthdaySend(person.month, person.day) }))
    .toSorted((a, b) => a.when.localeCompare(b.when));
  const sample = upcoming[0]?.person;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            In-house mail, automated notices and the delivery log · nothing leaves this browser
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-full px-4"
            onClick={() =>
              append(
                {
                  id: newId("EM"),
                  kind: "test",
                  userId: "staff-preview",
                  toName: SENDER,
                  toEmail: STAFF.find((s) => s.name === SENDER)?.email ?? "staff.preview@example.com",
                  status: "sent",
                  attempts: 1,
                  createdAt: stamp(),
                  detail: "Test email to yourself. Nothing was sent.",
                },
                "Test email sent to you"
              )
            }
          >
            Send me a test
          </Button>
          <Button className="h-10 rounded-full px-4" onClick={compose}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden />
            Compose
          </Button>
        </div>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">Delivery rate</p>
              <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{deliveryRate}%</p>
              <p className="mt-2 text-xs text-white/50">
                {count("sent")} of {attempted} attempted · failed mail retries up to {MAX_EMAIL_ATTEMPTS} times
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 tabular-nums">
              {log.length} in the log
            </span>
          </div>
          <SegmentBar
            className="relative h-2.5 bg-white/10"
            parts={STATUSES.map((status) => ({ key: status, value: count(status), className: STATUS_BAR[status] }))}
          />
          <dl className="relative grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
            {STATUSES.map((status) => (
              <div key={status} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs text-white/60 capitalize">
                  <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_BAR[status])} />
                  {status}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{count(status)}</dd>
              </div>
            ))}
          </dl>
          <p className="relative text-xs text-white/50">
            People with email off are skipped, except for security mail and required notices.
          </p>
        </section>

        <MessagesCard messages={desk.value.messages} onCompose={compose} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
          <div className="border-b border-border p-5">
            <CardHeader title="Birthday email" note="Automated · one per person each year">
              <StatusPill tone="success">On</StatusPill>
            </CardHeader>
          </div>
          <form
            className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = emailDeskSchema.shape.settings.safeParse(settings);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                return;
              }
              if (saveDesk({ ...desk.value, settings: parsed.data }, "Birthday email saved")) setDraft(null);
            }}
          >
            <div className="flex flex-col gap-4 p-5">
              <TextField
                id="birthday-subject"
                label="Subject"
                value={settings.subject}
                onChange={(subject) => setDraft({ ...settings, subject })}
              />
              <TextAreaField
                id="birthday-message"
                label="Message"
                helpText="{{name}} becomes the investor's first name."
                value={settings.message}
                textareaClassName="min-h-28"
                onChange={(message) => setDraft({ ...settings, message })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="birthday-time"
                  label="Sending time"
                  type="time"
                  value={settings.sendTime}
                  onChange={(sendTime) => setDraft({ ...settings, sendTime })}
                />
                <SelectField
                  id="birthday-zone"
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(timezone) => setDraft({ ...settings, timezone: timezone as typeof settings.timezone })}
                  items={[
                    { value: "Africa/Lagos", label: "Lagos" },
                    { value: "Africa/Accra", label: "Accra" },
                    { value: "UTC", label: "UTC" },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {draft && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-full px-4"
                    onClick={() => setDraft(null)}
                  >
                    Discard
                  </Button>
                )}
                <Button type="submit" className="h-10 rounded-full px-5" disabled={!draft}>
                  Save changes
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-5 lg:border-t-0 lg:border-l">
              <p className="text-xs text-muted-foreground">Preview{sample ? ` · ${sample.name.split(" ")[0]}` : ""}</p>
              <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/8">
                <div className="flex items-center justify-between bg-[#121212] px-4 py-3 text-xs text-white/70">
                  <span className="font-semibold text-white">City Core</span>
                  <HugeiconsIcon icon={BirthdayCakeIcon} aria-hidden className="size-4 text-accent" />
                </div>
                <div className="flex flex-col gap-2 bg-card p-4">
                  <p className="text-sm font-semibold">{settings.subject}</p>
                  <p className="text-xs/6 text-muted-foreground">
                    {mergeName(settings.message, sample?.name ?? "there")}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sends at {settings.sendTime}, {settings.timezone.replace("Africa/", "")} time.
              </p>
            </div>
          </form>
        </Card>

        <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
          <CardHeader title="Upcoming birthdays" note="Soonest first" />
          <ul className="flex flex-col">
            {upcoming.map(({ person, when }) => {
              const sent = sentThisYear(log, person.userId);
              const [day, month] = formatDate(when).split(" ");
              return (
                <li
                  key={person.userId}
                  className="flex items-center gap-3 border-b border-border py-2.5 last:border-none"
                >
                  <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-muted py-1 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase">{month}</span>
                    <span className="text-sm font-semibold tabular-nums">{day}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{person.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.month === 2 && person.day === 29 ? "Leap-day birthday · " : ""}
                      {person.emailOptIn ? person.email : "Email off · will be skipped"}
                    </span>
                  </span>
                  {sent ? (
                    <StatusPill tone="success">Sent</StatusPill>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full px-3"
                      onClick={() => sendBirthday(person)}
                    >
                      Send now
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Delivery log" note={`${rows.length} of ${log.length} shown`} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <FilterChips
            label="Email group"
            value={group}
            onChange={setGroup}
            options={GROUPS.map((value) => ({
              value,
              label: GROUP_META[value].label,
              count:
                value === "all" ? log.length : log.filter((row) => EMAIL_KIND_META[row.kind].group === value).length,
            }))}
          />
          <SearchField
            id="email-log-search"
            value={search}
            onChange={setSearch}
            placeholder="Search recipient, email or reference"
            className="min-w-0 flex-1 lg:ml-auto lg:max-w-72"
            groupClassName="h-9 bg-card dark:bg-card"
          />
        </div>
        <ul className="flex flex-col">
          {rows.map((row) => {
            const meta = EMAIL_KIND_META[row.kind];
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none"
              >
                <span className="relative shrink-0">
                  <Initials name={row.toName} />
                  <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full bg-card ring-1 ring-border">
                    <HugeiconsIcon icon={GROUP_META[meta.group].icon} aria-hidden className="size-2.5" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{meta.label}</span>
                    <span className="text-muted-foreground"> · {row.toName}</span>
                    {meta.security && (
                      <HugeiconsIcon
                        icon={CheckmarkBadge01Icon}
                        aria-label="Security email"
                        className="ml-1.5 inline size-3.5 text-muted-foreground"
                      />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
                </div>
                <span className="hidden text-right text-xs text-muted-foreground tabular-nums sm:block">
                  {formatDate(row.createdAt)}
                  <span className="block">
                    {formatTime(row.createdAt)} · try {row.attempts}/{MAX_EMAIL_ATTEMPTS}
                  </span>
                </span>
                <StatusPill tone={STATUS_TONE[row.status] as Tone}>{row.status}</StatusPill>
                {row.status === "failed" && row.attempts < MAX_EMAIL_ATTEMPTS ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full px-3"
                    onClick={() =>
                      saveDesk(
                        {
                          ...desk.value,
                          log: log.map((item) =>
                            item.id === row.id
                              ? { ...item, status: "sent", attempts: item.attempts + 1, detail: "Retry delivered" }
                              : item
                          ),
                        },
                        "Email resent"
                      )
                    }
                  >
                    Retry
                  </Button>
                ) : null}
              </li>
            );
          })}
          {!rows.length && <li className="py-8 text-center text-sm text-muted-foreground">No emails match.</li>}
        </ul>
      </Card>
    </div>
  );
}
