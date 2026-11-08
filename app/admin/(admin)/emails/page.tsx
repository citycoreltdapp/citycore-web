"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type BirthdayPerson,
  EMAIL_KIND_META,
  type EmailDesk,
  type EmailLogEntry,
  emailDeskSchema,
  emailGroupSchema,
} from "@/constant/schemas/admin-mail";
import { MAIL_AS_OF, MAX_EMAIL_ATTEMPTS, emailDecision, nextBirthdaySend } from "@/lib/mail-preview";
import { cn } from "cn";
import { toast } from "sonner";

import { Notice } from "../_operations/ui";
import { usePreviewState } from "../_operations/use-preview-state";
import { FilterChips, SegmentBar, StatusPill, type Tone, formatDate, toneBar, toneDot } from "../account/page";
import { CardHeader } from "../content/page";
import { Initials } from "../users/page";
import { EMAIL_DESK } from "./_data";

const STATUS_TONE = { queued: "warning", sent: "success", failed: "danger", skipped: "muted" } as const;
const GROUPS = ["all", ...emailGroupSchema.options] as const;
const GROUP_LABEL: Record<(typeof GROUPS)[number], string> = {
  all: "All",
  account: "Account",
  codes: "Codes",
  money: "Money",
  kyc: "KYC",
  helpdesk: "Helpdesk",
  birthday: "Birthday",
  staff: "Staff",
};
const STATUSES = ["sent", "queued", "failed", "skipped"] as const;

const sentThisYear = (log: EmailLogEntry[], userId: string) =>
  log.some(
    (row) =>
      row.kind === "birthday" &&
      row.userId === userId &&
      row.status === "sent" &&
      row.createdAt.startsWith(MAIL_AS_OF.slice(0, 4))
  );

const previewCopy = (message: string, name: string) => message.replaceAll("{{name}}", name);

export default function EmailsPage() {
  const desk = usePreviewState("citycore.admin.email", emailDeskSchema, EMAIL_DESK);
  const [group, setGroup] = React.useState<(typeof GROUPS)[number]>("all");
  const [draft, setDraft] = React.useState<EmailDesk["settings"] | null>(null);
  const settings = draft ?? desk.value.settings;

  const saveDesk = (next: EmailDesk, message: string) => {
    if (!desk.save(next)) return false;
    toast.success(message);
    return true;
  };

  const append = (row: EmailLogEntry, message: string) =>
    saveDesk({ ...desk.value, log: [row, ...desk.value.log] }, message);

  const sendBirthday = (person: BirthdayPerson) => {
    const decision = emailDecision({
      security: false,
      emailOptIn: person.emailOptIn,
      birthdayAlreadySent: sentThisYear(desk.value.log, person.userId),
    });
    append(
      {
        id: `EM-${Date.now()}`,
        kind: "birthday",
        userId: person.userId,
        toName: person.name,
        toEmail: person.email,
        status: decision.status === "queued" ? "sent" : "skipped",
        attempts: 1,
        createdAt: `${MAIL_AS_OF}T${desk.value.settings.sendTime}:00+01:00`,
        detail: decision.status === "queued" ? "Preview queue delivered this message" : decision.detail,
      },
      decision.status === "queued" ? `Birthday email queued for ${person.name}` : decision.detail
    );
  };

  const openPreview = (person: BirthdayPerson) => {
    const when = nextBirthdaySend(person.month, person.day);
    AppModal.open({
      title: settings.subject || "Birthday email",
      description: `To ${person.name} · ${person.email}`,
      size: "small",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Sends {formatDate(when)} at {settings.sendTime}, {settings.timezone.replace("Africa/", "")}
          </p>
          <p className="text-sm leading-7">{previewCopy(settings.message, person.name)}</p>
        </div>
      ),
      secondaryButton: { children: "Close" },
    });
  };

  const rows = desk.value.log.filter((row) => group === "all" || EMAIL_KIND_META[row.kind].group === group);
  const count = (status: EmailLogEntry["status"]) => desk.value.log.filter((row) => row.status === status).length;

  const sample = desk.value.people[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Nothing leaves this browser. A failed message retries up to {MAX_EMAIL_ATTEMPTS} times. Security mail still
            goes out when email is off.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full px-4"
          onClick={() =>
            append(
              {
                id: `EM-${Date.now()}`,
                kind: "test",
                userId: "staff-preview",
                toName: "Staff preview",
                toEmail: "staff.preview@example.com",
                status: "sent",
                attempts: 1,
                createdAt: `${MAIL_AS_OF}T12:00:00+01:00`,
                detail: "Test email. Nothing was sent.",
              },
              "Test email recorded in the log"
            )
          }
        >
          Send a test
        </Button>
      </div>

      <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative">
          <p className="text-sm text-white/60">Messages in the log</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{desk.value.log.length}</p>
        </div>
        <div className="relative flex flex-col gap-2.5">
          <SegmentBar
            className="h-2.5 bg-white/10"
            parts={STATUSES.map((status) => ({
              key: status,
              value: count(status),
              className: status === "sent" ? "bg-accent" : toneBar(STATUS_TONE[status]),
            }))}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {STATUSES.map((status) => (
              <p key={status} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", status === "sent" ? "bg-accent" : toneDot(STATUS_TONE[status]))}
                />
                <span className="text-white/60 capitalize">{status}</span>
                <span className="font-semibold tabular-nums">{count(status)}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <Notice>
        The preview queue retries a failed email up to {MAX_EMAIL_ATTEMPTS} times. People who turned email off are
        skipped, except for security emails such as password reset and email confirmation.
      </Notice>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
          <div className="border-b border-border p-5">
            <CardHeader title="Birthday email" note="{{name}} is replaced with the investor’s name" />
          </div>
          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = emailDeskSchema.shape.settings.safeParse(settings);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                return;
              }
              if (saveDesk({ ...desk.value, settings: parsed.data }, "Birthday email saved")) setDraft(parsed.data);
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
                value={settings.message}
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
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 p-5">
              <Button type="submit" className="h-10 rounded-full px-5">
                Save birthday email
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <CardHeader
              title="Preview"
              note={sample ? `${sample.name} · ${settings.sendTime}` : "No upcoming birthday"}
            />
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/8">
              <div className="flex items-center justify-between bg-[#121212] px-5 py-3 text-xs text-white/70">
                <span className="font-semibold text-white">City Core</span>
                <span>Birthday</span>
              </div>
              <div className="flex flex-col gap-3 bg-card p-5">
                <p className="text-lg font-semibold">{settings.subject}</p>
                <p className="text-sm/6 text-muted-foreground">
                  {previewCopy(settings.message, sample?.name ?? "there")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
            <CardHeader title="Upcoming birthdays" note="One birthday email per person each year" />
            <ul className="flex flex-col">
              {desk.value.people.map((person) => {
                const when = nextBirthdaySend(person.month, person.day);
                const sent = sentThisYear(desk.value.log, person.userId);
                return (
                  <li
                    key={person.userId}
                    className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none"
                  >
                    <Initials name={person.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.month === 2 && person.day === 29 ? "29 February · " : null}
                        Sends {formatDate(when)}
                        {person.emailOptIn ? "" : " · email off"}
                      </p>
                    </div>
                    {sent ? <StatusPill tone="success">Sent</StatusPill> : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full"
                      onClick={() => openPreview(person)}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      className="h-8 rounded-full"
                      disabled={sent}
                      onClick={() => sendBirthday(person)}
                    >
                      Send
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardHeader title="Delivery log" note="Status, recipient and retry count" />
          <FilterChips
            label="Email group"
            value={group}
            onChange={setGroup}
            options={GROUPS.map((value) => ({
              value,
              label: GROUP_LABEL[value],
              count:
                value === "all"
                  ? desk.value.log.length
                  : desk.value.log.filter((row) => EMAIL_KIND_META[row.kind].group === value).length,
            }))}
          />
        </div>
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-none">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {EMAIL_KIND_META[row.kind].label}
                  <span className="font-normal text-muted-foreground"> · {row.toName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.id} · {formatDate(row.createdAt)} · {row.attempts} of {MAX_EMAIL_ATTEMPTS} · {row.detail}
                </p>
              </div>
              <StatusPill tone={STATUS_TONE[row.status] as Tone}>{row.status}</StatusPill>
              {row.status === "failed" && row.attempts < MAX_EMAIL_ATTEMPTS ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full"
                  onClick={() =>
                    saveDesk(
                      {
                        ...desk.value,
                        log: desk.value.log.map((item) =>
                          item.id === row.id
                            ? {
                                ...item,
                                status: "sent",
                                attempts: item.attempts + 1,
                                detail: "Retry delivered in this preview",
                              }
                            : item
                        ),
                      },
                      "Failed email resent"
                    )
                  }
                >
                  Resend
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
