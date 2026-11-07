"use client";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminContentStateSchema } from "@/constant/schemas/admin-content";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

import { useReviewRequests } from "../_operations/requests";
import { usePreviewState } from "../_operations/use-preview-state";
import { CONTENT_DEFAULTS, LEGAL_DOCUMENTS, RECOMMENDATION_AUDIT, SIGNED_AUDIT } from "../_operations/workspace-data";
import { FilterChips, StatusPill, formatDate } from "../account/_ui";
import { AiContentWorkspace, LIBRARY } from "./_ai-workspace";
import { AuditTrail } from "./_audit";
import { LegalWorkspace } from "./_legal-workspace";
import { CardHeader, type Reviews } from "./_ui";

type View = "legal" | "ai" | "audit";
const REQUEST_KINDS = ["legal-review", "model-review", "editorial-review"];
const LEGAL_PENDING = LEGAL_DOCUMENTS.filter((d) => d.review.includes("pending")).length;
const CONTENT_PENDING = LIBRARY.filter((i) => i.tone === "warning").length;
const LIVE =
  LEGAL_DOCUMENTS.filter((d) => !d.review.includes("pending")).length +
  LIBRARY.filter((i) => i.tone === "success").length;

function GovernanceCard() {
  const groups = [
    { key: "legal", label: "Legal in review", value: LEGAL_PENDING, color: "bg-accent" },
    { key: "content", label: "Market & AI in review", value: CONTENT_PENDING, color: "bg-white/40" },
    { key: "live", label: "Live & current", value: LIVE, color: "bg-white/15" },
  ];
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#121212] p-6 text-white ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Awaiting approval</p>
          <p className="mt-2 text-4xl font-light tabular-nums md:text-5xl">{LEGAL_PENDING + CONTENT_PENDING}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">Live model v0.7</span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <div aria-hidden className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/10">
          {groups.map((g) => (
            <span key={g.key} className={cn("h-full rounded-full", g.color)} style={{ flexGrow: g.value }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {groups.map((g) => (
            <p key={g.key} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-2 rounded-full", g.color)} />
              <span className="text-white/60">{g.label}</span>
              <span className="font-semibold tabular-nums">{g.value}</span>
            </p>
          ))}
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        {[
          { label: "Signed contracts", value: SIGNED_AUDIT.length, note: "version-locked" },
          { label: "Recommendations", value: RECOMMENDATION_AUDIT.length, note: "in the audit log" },
          { label: "Legal documents", value: LEGAL_DOCUMENTS.length, note: "under version control" },
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

function RequestsCard({ reviews }: { reviews: Reviews }) {
  const open = reviews.requests.filter((r) => REQUEST_KINDS.includes(r.kind));
  return (
    <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Your review requests" note="Saved in this browser · nothing is published" />
      {open.length ? (
        <ul className="flex flex-col">
          {open.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-border py-3 last:border-none">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{r.summary}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.subjectId} · {formatDate(r.createdAt)}
                </span>
              </span>
              <StatusPill tone="warning">Pending</StatusPill>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-5" />
          </span>
          <p className="text-sm font-semibold">Nothing submitted yet</p>
          <p className="max-w-60 text-xs text-muted-foreground">
            Drafts you send for legal, model or editorial review show up here.
          </p>
        </div>
      )}
    </Card>
  );
}

export function ContentPage() {
  const store = usePreviewState("citycore-admin-content-v1", adminContentStateSchema, CONTENT_DEFAULTS);
  const reviews = useReviewRequests();
  const [view, setView] = React.useState<View>("legal");

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Helpdesk & audit</h1>
        <p className="text-sm text-muted-foreground">
          Legal documents, market & AI content and read-only audit trails · drafts never change what&apos;s live
        </p>
      </header>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <GovernanceCard />
        <RequestsCard reviews={reviews} />
      </div>

      <FilterChips
        label="Workspace"
        value={view}
        onChange={setView}
        options={[
          { value: "legal", label: "Legal documents", count: LEGAL_PENDING },
          { value: "ai", label: "Market & AI", count: CONTENT_PENDING },
          { value: "audit", label: "Audit trail" },
        ]}
      />

      {!store.ready ? (
        <Skeleton className="h-[32rem] rounded-2xl" />
      ) : (
        <>
          <div hidden={view !== "legal"}>
            <LegalWorkspace value={store.value} save={store.save} reviews={reviews} />
          </div>
          <div hidden={view !== "ai"}>
            <AiContentWorkspace value={store.value} save={store.save} reviews={reviews} />
          </div>
          <div hidden={view !== "audit"}>
            <AuditTrail />
          </div>
        </>
      )}
    </>
  );
}
