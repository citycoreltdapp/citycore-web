"use client";

import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  type AdminInvestor,
  type StatusChangeForm,
  statusChangeFormSchema,
  statusChangeRequestSchema,
} from "@/constant/schemas/admin-people";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { INVESTORS, STATUS_ITEMS } from "../../_operations/data";
import { useReviewRequests } from "../../_operations/requests";
import { Notice } from "../../_operations/ui";
import { money } from "../../account/_data";
import { FilterChips, SegmentBar, StatusPill, type Tone, formatDate, formatTime, toneDot } from "../../account/page";
import { ACCOUNT_TONES, BackLink, DetailList, Initials, KYC_LABELS, KYC_TONES, investorName, portfolio } from "../page";

type StatusFilter = "all" | AdminInvestor["status"];
const STATUS_FILTERS = ["all", "active", "suspended", "blacklisted"] as const;
const REASON_CODES = [
  { value: "compliance-review", label: "Compliance review" },
  { value: "risk-review", label: "Risk review" },
  { value: "investor-request", label: "Investor request" },
];
const linkedAccounts = (name: string): { account: string; owner: string; state: string; tone: Tone }[] => [
  { account: "Demo Bank · •••• 2048", owner: name, state: "Verified", tone: "success" },
  { account: "Virtual account · •••• 2048", owner: `City Core / ${name}`, state: "Awaiting KYC", tone: "warning" },
  { account: "Payment card · •••• 4242", owner: "Cardholder masked", state: "Token only", tone: "muted" },
];
const AUDIT_SAMPLE = [
  { at: "2026-10-22T10:40:00Z", text: "Nneka Eze viewed profile" },
  { at: "2026-10-21T14:22:00Z", text: "Phone verification updated" },
  { at: "2026-10-18T09:30:00Z", text: "Linked account review started" },
];

function Confirmation({
  investor,
  values,
  onSubmit,
}: {
  investor: AdminInvestor;
  values: StatusChangeForm;
  onSubmit: () => void;
}) {
  const [confirmation, setConfirmation] = React.useState("");
  const [requestKey] = React.useState(() => crypto.randomUUID());
  const result = statusChangeRequestSchema.safeParse({
    ...values,
    investorId: investor.id,
    currentStatus: investor.status,
    confirmation,
    idempotencyKey: requestKey,
  });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
        <Initials name={investorName(investor)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{investorName(investor)}</p>
          <p className="text-xs text-muted-foreground">{investor.id}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusPill tone={ACCOUNT_TONES[investor.status]}>{investor.status}</StatusPill>
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 text-muted-foreground" />
          <StatusPill tone={ACCOUNT_TONES[values.status]}>{values.status}</StatusPill>
        </div>
      </div>
      <p className="text-sm/6 text-muted-foreground">{values.reason}</p>
      <Notice>
        Existing investment records remain available. This saves a local review request and does not change live access
        or send an investor notification.
      </Notice>
      <TextField
        id="status-confirmation"
        label={`Type ${values.status.toUpperCase()} to confirm`}
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="off"
      />
      <Button className="w-full rounded-full" disabled={!result.success} onClick={onSubmit}>
        Submit for approval
      </Button>
    </div>
  );
}

function StatusSheet({
  investor,
  open,
  onOpenChange,
  ready,
  submit,
}: {
  investor: AdminInvestor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ready: boolean;
  submit: ReturnType<typeof useReviewRequests>["submit"];
}) {
  const form = useForm<StatusChangeForm>({ resolver: zodResolver(statusChangeFormSchema) });
  React.useEffect(() => {
    if (open)
      form.reset({
        status: investor.status === "active" ? "suspended" : "active",
        reasonCode: "compliance-review",
        reason: "",
      });
  }, [open, investor, form]);

  const review = (values: StatusChangeForm) => {
    if (values.status === investor.status) {
      form.setError("status", { message: "Choose a different status" });
      return;
    }
    AppModal.open({
      title: `Review ${values.status} request`,
      description: "No status change has been applied",
      content: (
        <Confirmation
          investor={investor}
          values={values}
          onSubmit={() => {
            const saved = submit({
              kind: "status",
              subjectId: investor.id,
              summary: `${investor.status} → ${values.status}`,
              reason: values.reason,
              details: { ...values },
            });
            if (saved) {
              AppModal.close();
              onOpenChange(false);
            }
          }}
        />
      ),
      secondaryButton: { children: "Cancel request" },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1 border-b border-border p-6">
          <SheetTitle className="text-base font-semibold">Change account status</SheetTitle>
          <SheetDescription>
            {investorName(investor)} is currently{" "}
            <span className="font-semibold text-foreground">{investor.status}</span>. Changes need a second approver.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-6"
          onSubmit={form.handleSubmit(review)}
          noValidate
        >
          <Controller
            control={form.control}
            name="status"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <p className="text-sm font-medium">Requested status</p>
                <div role="radiogroup" aria-label="Requested status" className="grid grid-cols-3 gap-2">
                  {STATUS_ITEMS.map((item) => {
                    const value = item.value as AdminInvestor["status"];
                    const isCurrent = value === investor.status;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === value}
                        disabled={isCurrent}
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-xl border border-border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                          field.value === value ? "border-foreground/30 bg-muted" : "hover:bg-muted/50"
                        )}
                      >
                        <span aria-hidden className={cn("size-2 rounded-full", toneDot(ACCOUNT_TONES[value]))} />
                        <span className="font-semibold">{item.label}</span>
                        {isCurrent && <span className="text-[11px] text-muted-foreground">Current</span>}
                      </button>
                    );
                  })}
                </div>
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="reasonCode"
            render={({ field, fieldState }) => (
              <SelectField
                {...field}
                id="status-reason-code"
                label="Reason code"
                items={REASON_CODES}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <TextAreaField
                {...field}
                value={field.value ?? ""}
                id="status-reason"
                label="Recorded reason"
                placeholder="What prompted this change, and what evidence you reviewed"
                textareaClassName="min-h-28"
                error={fieldState.error?.message}
              />
            )}
          />
          <Notice>
            Suspension restricts new activity; existing investment records stay accessible. Blacklisting also needs
            compliance and Super Admin review.
          </Notice>
          <Controller
            control={form.control}
            name="reviewed"
            render={({ field, fieldState }) => (
              <div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={field.value === true} onCheckedChange={field.onChange} />I reviewed the impact and
                  the investor&apos;s identity.
                </label>
                {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <Button className="mt-auto h-10 w-full rounded-full" type="submit" disabled={!ready}>
            Review change
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PortfolioCard({ investor }: { investor: AdminInvestor }) {
  return (
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative">
        <p className="text-sm text-white/60">Portfolio value</p>
        <p className="mt-2 text-4xl font-light tabular-nums">{money(portfolio(investor))}</p>
      </div>
      <div className="relative flex flex-col gap-2.5">
        <SegmentBar
          className="h-2.5 bg-white/10"
          parts={[
            { key: "principal", value: investor.principal, className: "bg-white/40" },
            { key: "yield", value: investor.yield, className: "bg-accent" },
          ]}
        />
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-white/40" />
            <span className="text-white/60">Principal</span>
            <span className="font-semibold tabular-nums">{money(investor.principal)}</span>
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            <span className="text-white/60">Yield</span>
            <span className="font-semibold tabular-nums">{money(investor.yield)}</span>
          </p>
        </div>
      </div>
      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Wallet", value: money(investor.balance) },
          { label: "Investments", value: investor.investmentCount },
          { label: "Units", value: investor.units },
        ].map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-white/60">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function UserManagement() {
  const query = useSearchParams();
  const requested = query.get("investor");
  const [selectedId, setSelectedId] = React.useState(requested ?? INVESTORS[0].id);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [isChanging, setIsChanging] = React.useState(false);
  const { requests, submit, ready } = useReviewRequests();
  const selected = INVESTORS.find((i) => i.id === selectedId) ?? INVESTORS[0];

  const term = search.trim().toLowerCase();
  const rows = INVESTORS.filter((i) => status === "all" || i.status === status).filter(
    (i) => !term || `${investorName(i)} ${i.email} ${i.id}`.toLowerCase().includes(term)
  );
  const pending = requests.filter((r) => r.subjectId === selected.id);

  const select = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `?investor=${encodeURIComponent(id)}`);
  };

  if (requested && !INVESTORS.some((i) => i.id === requested))
    return (
      <>
        <BackLink href="/users">Users & Admins</BackLink>
        <Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center ring-foreground/8">
          <h1 className="text-lg font-semibold">Investor not found</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            No account matches this reference. Pick an investor from the directory to continue.
          </p>
          <Button className="mt-2 rounded-full" nativeButton={false} render={<Link href="/users/management" />}>
            Open directory
          </Button>
        </Card>
      </>
    );

  return (
    <>
      <BackLink href="/users">Users & Admins</BackLink>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Investor accounts</h1>
          <p className="text-sm text-muted-foreground">Profiles, holdings and sensitive changes · illustrative data</p>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-full px-4"
          nativeButton={false}
          render={<Link href="/users/access" />}
        >
          Staff & access
        </Button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <Card className="min-w-0 gap-3 rounded-2xl px-3 py-3 ring-foreground/8 xl:sticky xl:top-24">
          <SearchField
            id="investor-search"
            value={search}
            onChange={setSearch}
            placeholder="Search name, email or reference"
            groupClassName="h-9 bg-card dark:bg-card"
          />
          <FilterChips
            label="Account status"
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
            }))}
          />
          <ul
            aria-label="Investors"
            className="-mx-1 flex max-h-[28rem] flex-col gap-0.5 overflow-y-auto px-1 xl:max-h-[calc(100vh-18rem)]"
          >
            {rows.map((investor) => {
              const isActive = investor.id === selected.id;
              return (
                <li key={investor.id}>
                  <button
                    type="button"
                    aria-current={isActive}
                    onClick={() => select(investor.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <Initials name={investorName(investor)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{investorName(investor)}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">{investor.id}</span>
                    </span>
                    <span
                      aria-label={investor.status}
                      className={cn("size-2 shrink-0 rounded-full", toneDot(ACCOUNT_TONES[investor.status]))}
                    />
                  </button>
                </li>
              );
            })}
            {!rows.length && <li className="px-2.5 py-6 text-center text-sm text-muted-foreground">No matches.</li>}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
            <div className="flex flex-wrap items-start gap-4">
              <Initials name={investorName(selected)} size="lg" className="size-14" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold tracking-tight">{investorName(selected)}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selected.email} · {selected.phone}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <StatusPill tone={ACCOUNT_TONES[selected.status]}>{selected.status}</StatusPill>
                  <StatusPill tone={KYC_TONES[selected.kycStatus]}>KYC {KYC_LABELS[selected.kycStatus]}</StatusPill>
                  <StatusPill tone="muted">Tier {selected.tier}</StatusPill>
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  className="h-9 flex-1 rounded-full px-3.5 sm:flex-none"
                  nativeButton={false}
                  render={<Link href={`/kyc/review?investor=${encodeURIComponent(selected.id)}`} />}
                >
                  KYC case
                </Button>
                <Button className="h-9 flex-1 rounded-full px-3.5 sm:flex-none" onClick={() => setIsChanging(true)}>
                  Change status
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
              {[
                ["Reference", selected.id],
                ["Joined", formatDate(selected.joinedAt)],
                ["KYC tier", `Tier ${selected.tier}`],
                ["Open requests", String(pending.length)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <PortfolioCard investor={selected} />
            <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Linked accounts</h3>
                <span className="text-xs text-muted-foreground">Masked</span>
              </div>
              <ul className="flex flex-col">
                {linkedAccounts(investorName(selected)).map((row) => (
                  <li
                    key={row.account}
                    className="flex items-center gap-3 border-b border-border py-3 last:border-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tabular-nums">{row.account}</span>
                      <span className="block truncate text-xs text-muted-foreground">{row.owner}</span>
                    </span>
                    <StatusPill tone={row.tone}>{row.state}</StatusPill>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-auto rounded-full"
                onClick={() =>
                  AppModal.open({
                    title: `${investorName(selected)} · transactions`,
                    content: (
                      <Notice>
                        No investor transaction feed is connected yet. Connect the transactions API with investor ID{" "}
                        {selected.id}.
                      </Notice>
                    ),
                  })
                }
              >
                Open transactions
              </Button>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Review requests</h3>
                <span className="text-xs text-muted-foreground">Saved in this browser</span>
              </div>
              {pending.length ? (
                <ul className="flex flex-col">
                  {pending.map((r) => (
                    <li key={r.id} className="flex flex-col gap-1.5 border-b border-border py-3 last:border-none">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold capitalize">{r.summary}</p>
                        <StatusPill tone="warning">Pending review</StatusPill>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{r.reason}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {formatDate(r.createdAt)} · {formatTime(r.createdAt)} UTC
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No open requests for this investor.</p>
              )}
            </Card>

            <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">Activity</h3>
                <span className="text-xs text-muted-foreground">Sample · read only</span>
              </div>
              <ol className="flex flex-col">
                {AUDIT_SAMPLE.map((entry) => (
                  <li key={entry.at} className="relative flex gap-3 pb-4 last:pb-0">
                    <span aria-hidden className="relative mt-1.5 flex flex-col items-center">
                      <span className="size-2 rounded-full bg-accent" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm">{entry.text}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {formatDate(entry.at)} · {formatTime(entry.at)} UTC
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <DetailList
                className="border-t border-border"
                rows={[
                  [
                    "Investor ID",
                    <button
                      key="copy"
                      type="button"
                      className="inline-flex items-center gap-1.5 hover:text-accent"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(selected.id)
                          .then(() => toast.success("Investor ID copied."))
                          .catch(() => toast.error("Clipboard access is unavailable."))
                      }
                    >
                      {selected.id}
                      <HugeiconsIcon icon={Copy01Icon} aria-hidden className="size-3.5" />
                    </button>,
                  ],
                ]}
              />
              <p className="text-xs text-muted-foreground">
                These entries aren&apos;t the immutable audit log. Connect the audit service for verified records.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <StatusSheet investor={selected} open={isChanging} onOpenChange={setIsChanging} ready={ready} submit={submit} />
    </>
  );
}
