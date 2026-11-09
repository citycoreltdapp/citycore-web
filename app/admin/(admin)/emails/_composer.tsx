"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { type ComposeEmailForm, composeEmailFormSchema } from "@/constant/schemas/admin-mail";
import { emailDecision } from "@/lib/mail-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { Controller, useForm, useWatch } from "react-hook-form";

import { INVESTORS, STAFF } from "../_operations/data";
import { FilterChips, StatusPill } from "../account/page";
import { Initials, investorName, roleLabel } from "../users/page";

const FORM_ID = "compose-email-form";

/** Someone in-house mail can reach, with what decides whether it's delivered. */
export interface Recipient {
  id: string;
  name: string;
  email: string;
  detail: string;
  /** Investors can turn email off; staff mail always goes out. */
  emailOptIn: boolean;
  /** Blacklisted investors and revoked staff never get in-house mail. */
  blocked: boolean;
}

export function recipientsFor(audience: ComposeEmailForm["audience"], optOuts: Set<string>): Recipient[] {
  return audience === "staff"
    ? STAFF.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        detail: roleLabel(s.role),
        emailOptIn: true,
        blocked: s.access === "revoked",
      }))
    : INVESTORS.map((i) => ({
        id: i.id,
        name: investorName(i),
        email: i.email,
        detail: `${i.id} · ${i.status}`,
        emailOptIn: !optOuts.has(i.id),
        blocked: i.status === "blacklisted",
      }));
}

/** Whether one recipient gets the message, using the same rule as every other email. */
export function deliveryFor(recipient: Recipient, required: boolean) {
  if (recipient.blocked) return { status: "skipped" as const, detail: "Account can't receive in-house mail" };
  const decision = emailDecision({ security: required, emailOptIn: recipient.emailOptIn });
  return decision.status === "queued"
    ? { status: "sent" as const, detail: required ? "Required notice" : "Delivered in this preview" }
    : decision;
}

export const mergeName = (text: string, name: string) => text.replaceAll("{{name}}", name.split(" ")[0]);

function RecipientPicker({
  people,
  value,
  onChange,
  error,
}: {
  people: Recipient[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const [search, setSearch] = React.useState("");
  const term = search.trim().toLowerCase();
  const shown = people.filter((p) => !term || `${p.name} ${p.email} ${p.detail}`.toLowerCase().includes(term));
  const selected = new Set(value);
  const toggle = (id: string) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  const allShown = shown.length > 0 && shown.every((p) => selected.has(p.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <SearchField
            id="compose-recipient-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email or ID"
            className="min-w-0 flex-1"
            groupClassName="h-9 bg-card dark:bg-card"
          />
          <Button
            type="button"
            variant="ghost"
            className="h-9 shrink-0 rounded-full px-3 text-xs"
            disabled={!shown.length}
            onClick={() =>
              onChange(
                allShown
                  ? value.filter((id) => !shown.some((p) => p.id === id))
                  : [...new Set([...value, ...shown.map((p) => p.id)])]
              )
            }
          >
            {allShown ? "Clear shown" : "Select shown"}
          </Button>
        </div>
        <ul className="max-h-56 overflow-y-auto overscroll-contain p-1">
          {shown.map((person) => (
            <li key={person.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60",
                  selected.has(person.id) && "bg-muted"
                )}
              >
                <Checkbox checked={selected.has(person.id)} onCheckedChange={() => toggle(person.id)} />
                <Initials name={person.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{person.name}</span>
                  <span className="block truncate text-xs text-muted-foreground capitalize">{person.detail}</span>
                </span>
                {person.blocked ? (
                  <StatusPill tone="danger">Blocked</StatusPill>
                ) : !person.emailOptIn ? (
                  <StatusPill tone="muted">Email off</StatusPill>
                ) : null}
              </label>
            </li>
          ))}
          {!shown.length && <li className="py-6 text-center text-sm text-muted-foreground">No one matches.</li>}
        </ul>
      </div>
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? `${value.length} selected`}
      </p>
    </div>
  );
}

function ComposeBody({
  optOuts,
  sender,
  onSend,
}: {
  optOuts: Set<string>;
  sender: string;
  onSend: (form: ComposeEmailForm, recipients: Recipient[]) => boolean;
}) {
  const form = useForm<ComposeEmailForm>({
    resolver: zodResolver(composeEmailFormSchema),
    defaultValues: {
      audience: "staff",
      recipientMode: "everyone",
      recipientIds: [],
      subject: "",
      body: "Hi {{name}},\n\n",
      required: false,
    },
  });
  const draft = useWatch({ control: form.control });
  const audience = draft.audience ?? "staff";
  const people = recipientsFor(audience, optOuts);
  const targets =
    draft.recipientMode === "everyone" ? people : people.filter((p) => draft.recipientIds?.includes(p.id));
  const results = targets.map((person) => deliveryFor(person, !!draft.required));
  const delivered = results.filter((r) => r.status === "sent").length;
  const sample = targets.find((_, index) => results[index].status === "sent") ?? targets[0] ?? people[0];
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const insertName = () => {
    const area = bodyRef.current;
    const body = form.getValues("body");
    const at = area?.selectionStart ?? body.length;
    form.setValue("body", `${body.slice(0, at)}{{name}}${body.slice(area?.selectionEnd ?? at)}`, {
      shouldDirty: true,
    });
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(at + 8, at + 8);
    });
  };

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (onSend(values, targets)) AppModal.close();
      })}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Send to</p>
          <Controller
            control={form.control}
            name="audience"
            render={({ field }) => (
              <FilterChips
                label="Audience"
                value={field.value}
                onChange={(next) => {
                  field.onChange(next);
                  form.setValue("recipientIds", []);
                  if (next === "staff") form.setValue("required", false);
                }}
                options={[
                  { value: "staff", label: "Staff", count: STAFF.length },
                  { value: "investors", label: "Investors", count: INVESTORS.length },
                ]}
              />
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="recipientMode"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Recipients" className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "everyone", title: `All ${audience}`, hint: `${people.length} people` },
                  { value: "pick", title: "Choose people", hint: "Search and tick" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    field.value === option.value ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm font-semibold">{option.title}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
          )}
        />

        {draft.recipientMode === "pick" && (
          <Controller
            control={form.control}
            name="recipientIds"
            render={({ field, fieldState }) => (
              <RecipientPicker
                people={people}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        )}

        <Controller
          control={form.control}
          name="subject"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="compose-subject"
              label="Subject"
              placeholder={audience === "staff" ? "Quarter-end payout freeze" : "New property opening this month"}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="body"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-2">
              <TextAreaField
                {...field}
                ref={bodyRef}
                id="compose-body"
                label="Message"
                textareaClassName="min-h-40"
                error={fieldState.error?.message}
              />
              <button
                type="button"
                onClick={insertName}
                className="w-fit rounded-full border border-dashed border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                + {"{{name}}"} first name
              </button>
            </div>
          )}
        />

        {audience === "investors" && (
          <Controller
            control={form.control}
            name="required"
            render={({ field }) => (
              <label className="flex items-start justify-between gap-4 rounded-xl bg-muted/50 p-4">
                <span>
                  <span className="block text-sm font-semibold">Required notice</span>
                  <span className="block text-xs/5 text-muted-foreground">
                    Reaches investors who turned email off. Use it only for policy, legal or security notices.
                  </span>
                </span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
        <p className="text-xs text-muted-foreground">Preview{sample ? ` · as ${sample.name}` : ""}</p>
        <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/8">
          <div className="relative flex items-center justify-between overflow-hidden bg-[#121212] px-5 py-4 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-8 size-32 rounded-full bg-accent/30 blur-2xl"
            />
            <span className="relative text-sm font-semibold">City Core</span>
            <span className="relative rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80">
              {audience === "staff" ? "Staff memo" : draft.required ? "Required notice" : "Announcement"}
            </span>
          </div>
          <div className="flex flex-col gap-3 bg-card p-5">
            <p className="text-xs text-muted-foreground">
              From {sender} · to {sample?.email ?? "—"}
            </p>
            <p className="text-base font-semibold">{draft.subject || "Your subject"}</p>
            <p className="text-sm/6 whitespace-pre-line text-muted-foreground">
              {mergeName(draft.body || "Your message", sample?.name ?? "there")}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Delivered</dt>
            <dd className="mt-0.5 text-xl font-light tabular-nums">{delivered}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Skipped</dt>
            <dd className="mt-0.5 text-xl font-light tabular-nums">{targets.length - delivered}</dd>
          </div>
          <dd className="col-span-2 text-xs text-muted-foreground">
            {audience === "staff"
              ? "Staff mail always goes out, except to revoked accounts."
              : "Investors with email off or a blacklisted account are skipped."}
          </dd>
        </dl>
      </aside>
    </form>
  );
}

export function openComposer(options: {
  optOuts: Set<string>;
  sender: string;
  onSend: (form: ComposeEmailForm, recipients: Recipient[]) => boolean;
}) {
  AppModal.open({
    title: "New message",
    description: "In-house mail to your team or your investors.",
    size: "full",
    content: (
      <div className="mx-auto w-full max-w-5xl">
        <ComposeBody {...options} />
      </div>
    ),
    footer: (
      <div className="mx-auto flex w-full max-w-5xl justify-end gap-2">
        <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={AppModal.close}>
          Discard
        </Button>
        <Button type="submit" form={FORM_ID} className="h-10 rounded-full px-5">
          Send message
        </Button>
      </div>
    ),
  });
}
