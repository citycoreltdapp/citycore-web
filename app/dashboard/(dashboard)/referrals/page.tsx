"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Downline, type ReferralDashboard, type ReferralEarning } from "@/constant/schemas/referrals";
import { REFERRAL_DASHBOARD, REFERRAL_PLAN, referralTotals } from "@/lib/referrals";
import { useReferredBy } from "@/lib/referred-by";
import {
  ArrowRight01Icon,
  ChartLineData01Icon,
  Coins01Icon,
  Copy01Icon,
  Link01Icon,
  Share08Icon,
  Tick02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "cn";
import Link from "next/link";
import { toast } from "sonner";

import { naira } from "../marketplace/page";

const invitePath = (code: string) => `/dashboard/signup?ref=${code}`;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async (key: string, text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(message);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };
  return { copied, copy };
}

const STEPS = [
  { title: "Share your code", body: "They enter it when they create a City Core account." },
  { title: "They invest", body: "Only packages with a referral plan qualify." },
  {
    title: `You earn ${REFERRAL_PLAN.commissionPercent}%`,
    body: "One-time commission, credited once the investment is confirmed.",
  },
];

function InviteCard({ code }: { code: string }) {
  const { copied, copy } = useCopy();
  const inviteLink = () => `${window.location.origin}${invitePath(code)}`;
  const share = async () => {
    const data = {
      title: "Join me on City Core",
      text: `Use my referral code ${code} when you sign up for City Core.`,
      url: inviteLink(),
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
    } else {
      await copy("link", data.url, "Invite link copied");
    }
  };

  return (
    <section className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[#121212] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] mask-[linear-gradient(to_left,black,transparent_70%)] bg-size-[18px_18px]"
      />

      <div className="relative flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/60">Your referral code</p>
            <p className="mt-2 font-mono text-4xl font-medium tracking-[0.18em] md:text-5xl">{code}</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
            <span className="font-semibold text-accent">{REFERRAL_PLAN.commissionPercent}%</span> per qualifying
            investment
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="h-11 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/85"
            onClick={() => copy("code", code, "Referral code copied")}
          >
            <HugeiconsIcon icon={copied === "code" ? Tick02Icon : Copy01Icon} aria-hidden />
            {copied === "code" ? "Copied" : "Copy code"}
          </Button>
          <Button
            variant="ghost"
            className="h-11 rounded-full border border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
            onClick={() => copy("link", inviteLink(), "Invite link copied")}
          >
            <HugeiconsIcon icon={copied === "link" ? Tick02Icon : Link01Icon} aria-hidden />
            {copied === "link" ? "Link copied" : "Copy invite link"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share invite"
            className="size-11 rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={share}
          >
            <HugeiconsIcon icon={Share08Icon} aria-hidden />
          </Button>
        </div>
      </div>

      <ol className="relative mt-auto grid border-t border-dashed border-white/15 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 border-white/10 px-6 py-5 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0 md:px-8"
          >
            <span className="font-mono text-xs text-accent tabular-nums">0{index + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{step.title}</span>
              <span className="mt-1 block text-xs/5 text-white/55">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});
const formatDate = (iso: string) => DATE_FORMAT.format(new Date(iso));

function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase",
        className
      )}
    >
      {letters}
    </span>
  );
}

const PILL_TONES = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        PILL_TONES[tone]
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function EarningRow({ earning }: { earning: ReferralEarning }) {
  const paid = earning.status === "paid";
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={earning.downlineId ? Coins01Icon : ChartLineData01Icon} aria-hidden className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{earning.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {earning.packageName} · {formatDate(earning.date)}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={cn("text-sm font-semibold tabular-nums", paid && "text-success")}>
          {paid ? "+" : ""}
          {naira(earning.amount)}
        </span>
        <Pill tone={paid ? "success" : "warning"}>{paid ? "Paid" : "Pending"}</Pill>
      </span>
    </li>
  );
}

type Section = "downlines" | "commission" | "roi";

function Empty({ icon, title, message }: { icon: IconSvgElement; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={icon} aria-hidden className="size-5" />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DownlineSheet({
  person,
  commissions,
  open,
  onOpenChange,
}: {
  person: Downline | null;
  commissions: ReferralEarning[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const earned = commissions.reduce((total, item) => total + item.amount, 0);
  const milestones = person && [
    { label: "Joined City Core", detail: formatDate(person.joined), done: true },
    {
      label: "Made a qualifying investment",
      detail: person.hasInvested ? "Commission applies" : "Not yet",
      done: person.hasInvested,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {person && (
          <>
            <SheetHeader className="gap-4 border-b border-border p-6">
              <Initials name={person.name} className="size-14 text-lg" />
              <div className="space-y-1">
                <SheetTitle className="text-xl font-semibold">{person.name}</SheetTitle>
                <SheetDescription>Joined {formatDate(person.joined)}</SheetDescription>
              </div>
              <Pill tone={person.hasInvested ? "success" : "muted"}>
                {person.hasInvested ? "Has made an investment" : "Has joined City Core"}
              </Pill>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
              <ol className="space-y-0">
                {milestones?.map((step) => (
                  <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute top-4 bottom-0 left-[7px] w-px bg-border in-[li:last-child]:hidden"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "relative mt-0.5 size-[15px] shrink-0 rounded-full border-2",
                        step.done ? "border-success bg-success" : "border-border bg-card"
                      )}
                    />
                    <span className="text-sm">
                      <span className={cn("block font-semibold", !step.done && "text-muted-foreground")}>
                        {step.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{step.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">Your commission from this referral</h3>
                  <span className="text-sm font-semibold tabular-nums">{naira(earned)}</span>
                </div>
                {commissions.length === 0 ? (
                  <Empty
                    icon={Coins01Icon}
                    title="No commission yet"
                    message="Commission appears after a qualifying investment."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {commissions.map((earning) => (
                      <EarningRow key={earning.id} earning={earning} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActivityCard({ data }: { data: ReferralDashboard }) {
  const [section, setSection] = useState<Section>("downlines");
  const [selected, setSelected] = useState<Downline | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const commissionsOf = (id: string) => data.commissions.filter((item) => item.downlineId === id);
  const earnings = section === "commission" ? data.commissions : data.investorReturns;

  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <h2 className="text-base font-semibold">Activity</h2>
        <Tabs value={section} onValueChange={(value) => setSection(value as Section)}>
          <TabsList aria-label="Referral activity">
            <TabsTrigger value="downlines">Downlines ({data.downlines.length})</TabsTrigger>
            <TabsTrigger value="commission">Commission ({data.commissions.length})</TabsTrigger>
            <TabsTrigger value="roi">Your ROI ({data.investorReturns.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-5">
        {section === "downlines" ? (
          data.downlines.length === 0 ? (
            <Empty
              icon={UserMultiple02Icon}
              title="No referrals yet"
              message="Share your code to invite your first referral."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.downlines.map((person) => {
                const earned = commissionsOf(person.id).reduce((total, item) => total + item.amount, 0);
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(person);
                        setSheetOpen(true);
                      }}
                      className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Initials name={person.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{person.name}</span>
                        <span className="block text-xs text-muted-foreground">Joined {formatDate(person.joined)}</span>
                      </span>
                      <span className="hidden text-right sm:block">
                        <span className="block text-sm font-semibold tabular-nums">{earned ? naira(earned) : "—"}</span>
                        <span className="block text-xs text-muted-foreground">Your commission</span>
                      </span>
                      <Pill tone={person.hasInvested ? "success" : "muted"}>
                        {person.hasInvested ? "Invested" : "Joined"}
                      </Pill>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        aria-hidden
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : earnings.length === 0 ? (
          <Empty
            icon={Coins01Icon}
            title={section === "commission" ? "No commission yet" : "No ROI paid yet"}
            message="Completed and pending entries will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {earnings.map((earning) => (
              <EarningRow key={earning.id} earning={earning} />
            ))}
          </ul>
        )}
      </div>

      <p className="mt-auto border-t border-border bg-muted/40 px-5 py-4 text-xs/5 text-muted-foreground">
        Commission is earned from referrals. Your ROI paid is the return already paid on your own investments. Pending
        commission is awaiting confirmation.
      </p>

      <DownlineSheet
        person={selected}
        commissions={selected ? commissionsOf(selected.id) : []}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Card>
  );
}

function EarningsCard({ data }: { data: ReferralDashboard }) {
  const { commissionReceived, pendingCommission, roiPaid } = referralTotals(data);
  const total = commissionReceived + pendingCommission;
  const legend = [
    { label: "Received", value: commissionReceived, dot: "bg-success" },
    { label: "Pending confirmation", value: pendingCommission, dot: "bg-warning" },
  ];

  return (
    <Card className="gap-0 rounded-2xl py-0 ring-foreground/8">
      <div className="flex flex-col gap-5 p-5">
        <div>
          <p className="text-xs text-muted-foreground">Commission received</p>
          <p className="mt-1 text-4xl font-light text-success tabular-nums">{naira(commissionReceived)}</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {naira(total)} earned from {data.commissions.length} qualifying{" "}
            {data.commissions.length === 1 ? "investment" : "investments"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-muted" aria-hidden>
            {total > 0 &&
              legend.map(({ label, value, dot }) => (
                <span key={label} className={cn("rounded-full", dot)} style={{ flexGrow: value }} />
              ))}
          </div>
          <dl className="space-y-2">
            {legend.map(({ label, value, dot }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <span aria-hidden className={cn("size-2 rounded-full", dot)} />
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="ml-auto font-semibold tabular-nums">{naira(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 rounded-b-2xl border-t border-border bg-muted/40 p-5">
        <div>
          <p className="text-sm font-semibold">Your ROI paid</p>
          <p className="text-xs text-muted-foreground">Return on your own investments, not commission</p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{naira(roiPaid)}</p>
      </div>
    </Card>
  );
}

function NetworkCard({ data }: { data: ReferralDashboard }) {
  const { activeReferrals } = referralTotals(data);
  const total = data.downlines.length;
  const rate = total ? Math.round((activeReferrals / total) * 100) : 0;

  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Your network</h2>
        <div className="flex -space-x-2">
          {data.downlines.slice(0, 4).map((person) => (
            <Initials key={person.id} name={person.name} className="size-8 text-[11px] ring-2 ring-card" />
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-border">
        {[
          ["Referrals", total],
          ["Invested", activeReferrals],
          ["Converted", `${rate}%`],
        ].map(([label, value]) => (
          <div key={label} className="px-3 first:pl-0 last:pr-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-light tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent" style={{ width: `${rate}%` }} />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {total - activeReferrals} joined but haven&apos;t invested yet
        </p>
      </div>
    </Card>
  );
}

function PlanCard() {
  const referredBy = useReferredBy();
  const plan = REFERRAL_PLAN;

  return (
    <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
      <div>
        <p className="text-xs text-muted-foreground">Active referral plan</p>
        <h2 className="mt-0.5 text-base font-semibold">{plan.name}</h2>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {[
          ["Commission", `${plan.commissionPercent}%`],
          ["Target ROI", `${plan.annualRoiPercent}% p.a.`],
          ["Duration", `${plan.tenureMonths} months`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/60 px-3 py-2.5">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs/5 text-muted-foreground">{plan.commissionTerms}</p>
      {referredBy && (
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Initials name={referredBy.name} className="size-9 bg-accent/20 text-xs" />
          <p className="min-w-0 text-sm">
            <span className="block text-xs text-muted-foreground">You were referred by</span>
            <span className="font-semibold">{referredBy.name}</span>
            <span className="text-muted-foreground"> · {referredBy.code}</span>
          </p>
        </div>
      )}
    </Card>
  );
}

export default function Client$ReferralsPage() {
  const data = REFERRAL_DASHBOARD;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
          <p className="text-sm/6 text-muted-foreground">
            Invite someone to join City Core with your code. When they make a qualifying investment, you earn the
            commission attached to that package.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          className="h-10 rounded-full px-5"
          render={<Link href="/dashboard/marketplace" />}
        >
          See qualifying packages
        </Button>
      </header>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <InviteCard code={data.code} />
        <EarningsCard data={data} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ActivityCard data={data} />
        <div className="flex min-w-0 flex-col gap-5">
          <NetworkCard data={data} />
          <PlanCard />
        </div>
      </div>
    </>
  );
}
