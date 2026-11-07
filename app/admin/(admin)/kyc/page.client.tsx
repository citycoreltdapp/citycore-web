"use client";
import * as React from "react";

import { DataTable } from "@/components/primitives/data-table";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminInvestor } from "@/constant/schemas/admin-people";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { INVESTORS, KYC_CASES } from "../_operations/data";
import { FilterChips, SegmentBar, StatusPill, formatDate, toneBar, toneDot } from "../account/_ui";
import { Initials, InvestorSheet, KYC_TONES, PersonCell } from "../users/_ui";
import { ChecksSummary, ageLabel, caseFor, reviewHref } from "./_ui";

type StatusFilter = "all" | AdminInvestor["kycStatus"];
const STATUSES = ["all", "pending", "escalated", "approved", "rejected"] as const;
const OPEN = KYC_CASES.filter((c) => c.status === "pending" || c.status === "escalated").toSorted((a, b) =>
  a.submittedAt.localeCompare(b.submittedAt)
);
const countOf = (status: StatusFilter) => INVESTORS.filter((i) => status === "all" || i.kycStatus === status).length;

const columns: ColumnDef<AdminInvestor>[] = [
  {
    accessorKey: "name",
    header: "Applicant",
    cell: ({ row }) => <PersonCell name={row.original.name} detail={row.original.id} />,
  },
  { accessorKey: "tier", header: "Tier", cell: ({ getValue }) => `Tier ${getValue<number>()}` },
  {
    id: "submitted",
    header: "Submitted",
    cell: ({ row }) => {
      const record = caseFor(row.original.id);
      if (!record) return <span className="text-xs">Verified on file</span>;
      return (
        <div>
          <p className="text-foreground tabular-nums">{formatDate(record.submittedAt)}</p>
          <p className="text-xs">{ageLabel(record.submittedAt)}</p>
        </div>
      );
    },
  },
  {
    id: "checks",
    header: "Checks",
    cell: ({ row }) => {
      const record = caseFor(row.original.id);
      return record ? <ChecksSummary record={record} /> : <span className="text-xs">—</span>;
    },
  },
  {
    accessorKey: "kycStatus",
    header: "Status",
    cell: ({ row }) => <StatusPill tone={KYC_TONES[row.original.kycStatus]}>{row.original.kycStatus}</StatusPill>,
  },
];

function QueueHealthCard() {
  const decided = countOf("approved") + countOf("rejected");
  const mismatches = OPEN.filter((c) => !c.bvnMatch || !c.ninMatch).length;
  const groups = (["approved", "pending", "escalated", "rejected"] as const).map((status) => ({
    status,
    count: countOf(status),
  }));
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Awaiting a decision</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{OPEN.length}</p>
        </div>
        {OPEN[0] && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            Oldest waiting {ageLabel(OPEN[0].submittedAt).toLowerCase()}
          </span>
        )}
      </div>

      <div className="relative flex flex-col gap-2.5">
        <SegmentBar
          className="h-2.5 bg-white/10"
          parts={groups.map(({ status, count }) => ({
            key: status,
            value: count,
            className:
              status === "pending" ? "bg-white/40" : status === "approved" ? "bg-accent" : toneBar(KYC_TONES[status]),
          }))}
        />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {groups.map(({ status, count }) => (
            <p key={status} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  status === "pending"
                    ? "bg-white/40"
                    : status === "approved"
                      ? "bg-accent"
                      : toneDot(KYC_TONES[status])
                )}
              />
              <span className="text-white/60 capitalize">{status}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </p>
          ))}
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          {
            label: "Approval rate",
            value: decided ? `${Math.round((countOf("approved") / decided) * 100)}%` : "—",
            note: `of ${decided} decided`,
          },
          { label: "Escalated", value: countOf("escalated"), note: "need a second look" },
          { label: "Mismatches", value: mismatches, note: "BVN or NIN failed" },
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

function NextUpCard() {
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Next up</h2>
          <p className="text-xs text-muted-foreground">Oldest applications first</p>
        </div>
        <Link
          href="/kyc/review"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Queue
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4" />
        </Link>
      </div>
      <ul className="flex flex-col">
        {OPEN.slice(0, 4).map((record) => {
          const investor = INVESTORS.find((i) => i.id === record.investorId)!;
          return (
            <li key={record.id}>
              <Link
                href={reviewHref(investor.id)}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Initials name={investor.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{investor.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {record.id} · {ageLabel(record.submittedAt)}
                  </span>
                </span>
                <StatusPill tone={KYC_TONES[record.status]}>{record.status}</StatusPill>
              </Link>
            </li>
          );
        })}
        {!OPEN.length && <li className="py-6 text-center text-sm text-muted-foreground">The queue is clear.</li>}
      </ul>
    </Card>
  );
}

export function KycOverview() {
  const router = useRouter();
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("oldest");
  const [quickLook, setQuickLook] = React.useState<AdminInvestor | null>(null);

  const term = search.trim().toLowerCase();
  const submitted = (i: AdminInvestor) => caseFor(i.id)?.submittedAt ?? "";
  const rows = INVESTORS.filter((i) => status === "all" || i.kycStatus === status)
    .filter((i) => !term || `${i.name} ${i.id} ${i.phone} ${caseFor(i.id)?.id ?? ""}`.toLowerCase().includes(term))
    .toSorted((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      // Cases first, then investors verified on file.
      const [x, y] = [submitted(a), submitted(b)];
      if (!x || !y) return x ? -1 : y ? 1 : 0;
      return sort === "oldest" ? x.localeCompare(y) : y.localeCompare(x);
    });

  // Open the case when there is one; investors verified on file get the profile quick look.
  const open = (investor: AdminInvestor) =>
    caseFor(investor.id) ? router.push(reviewHref(investor.id)) : setQuickLook(investor);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">KYC compliance</h1>
          <p className="text-sm text-muted-foreground">Restricted workspace · evidence is masked and illustrative</p>
        </div>
        <Button className="h-10 rounded-full px-4" nativeButton={false} render={<Link href="/kyc/review" />}>
          Open review queue
        </Button>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <QueueHealthCard />
        <NextUpCard />
      </div>

      <Card className="gap-4 rounded-2xl px-5 py-5 ring-foreground/8">
        <div>
          <h2 className="text-base font-semibold">Verification directory</h2>
          <p className="text-xs text-muted-foreground">Select a row to open the case</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <FilterChips
            label="KYC status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((value) => ({
              value,
              label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
              count: countOf(value),
            }))}
          />
          <div className="flex flex-1 gap-2 lg:justify-end">
            <SearchField
              id="kyc-search"
              value={search}
              onChange={setSearch}
              placeholder="Search applicant or case"
              className="min-w-0 flex-1 lg:max-w-72"
              groupClassName="h-9 bg-card dark:bg-card"
            />
            <SelectField
              id="kyc-sort"
              value={sort}
              onChange={setSort}
              triggerAria-label="Sort"
              triggerClassName="h-9! w-36 rounded-full bg-card px-3.5"
              items={[
                { value: "oldest", label: "Oldest first" },
                { value: "newest", label: "Newest first" },
                { value: "name", label: "Name A–Z" },
              ]}
            />
          </div>
        </div>
        <DataTable
          key={`${status}-${search}-${sort}`}
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          pageSize={8}
          onRowClick={open}
          rowClassName="border-none even:bg-muted/50 hover:bg-muted"
          actionsHeader="Action"
          actions={[
            { label: "Open", onClick: open },
            {
              label: "Investor profile",
              onClick: (i) => router.push(`/users/management?investor=${encodeURIComponent(i.id)}`),
            },
          ]}
          emptyMessage="No applicants match these filters."
        />
      </Card>

      <InvestorSheet investor={quickLook} onClose={() => setQuickLook(null)} />
    </>
  );
}
