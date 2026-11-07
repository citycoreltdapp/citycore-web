"use client";

import { AppModal } from "@/components/primitives/app-modal";
import { Card } from "@/components/ui/card";
import { AiBrain01Icon, ArrowRight01Icon, File01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Notice } from "../_operations/ui";
import { RECOMMENDATION_AUDIT, SIGNED_AUDIT } from "../_operations/workspace-data";
import { StatusPill, formatDate, formatTime } from "../account/_ui";
import { DetailList } from "../users/_ui";
import { CardHeader } from "./_ui";

const ROW =
  "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring";

function ReadOnly() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3" />
      Read only
    </span>
  );
}

export function AuditTrail() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Signed contracts" note="Each acceptance stays bound to the version signed">
          <ReadOnly />
        </CardHeader>
        <ul className="flex flex-col">
          {SIGNED_AUDIT.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={ROW}
                onClick={() =>
                  AppModal.open({
                    title: `Contract ${r.id}`,
                    description: r.investorReference,
                    content: (
                      <div className="space-y-4">
                        <DetailList
                          rows={[
                            ["Accepted version", r.acceptedVersion],
                            ["Accepted at", `${formatDate(r.acceptedAt)}, ${formatTime(r.acceptedAt)} UTC`],
                            ["Consent evidence", r.evidenceReference],
                          ]}
                        />
                        <Notice>
                          Illustrative record. Connect the immutable audit service for verified evidence. Publishing a
                          new template can&apos;t rewrite this acceptance.
                        </Notice>
                      </div>
                    ),
                  })
                }
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon icon={File01Icon} aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold tabular-nums">
                    {r.id} · {r.investorReference}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {formatDate(r.acceptedAt)}, {formatTime(r.acceptedAt)} UTC
                  </span>
                </span>
                <StatusPill tone="muted">{r.acceptedVersion}</StatusPill>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="gap-3 rounded-2xl px-5 py-5 ring-foreground/8">
        <CardHeader title="Recommendation log" note="Masked investor queries · access is audited">
          <ReadOnly />
        </CardHeader>
        <ul className="flex flex-col">
          {RECOMMENDATION_AUDIT.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={ROW}
                onClick={() =>
                  AppModal.open({
                    title: `Recommendation ${r.id}`,
                    description: r.investorReference,
                    content: (
                      <div className="space-y-4">
                        <DetailList
                          rows={[
                            ["Query", r.query],
                            ["Recommendation", r.recommendation],
                            ["Context", r.context],
                            ["Model version", `v${r.modelVersion}`],
                          ]}
                        />
                        <Notice>This view doesn&apos;t rerun the model or change a historical recommendation.</Notice>
                      </div>
                    ),
                  })
                }
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <HugeiconsIcon icon={AiBrain01Icon} aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">&ldquo;{r.query}&rdquo;</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.recommendation} · {r.investorReference}
                  </span>
                </span>
                <StatusPill tone="muted">v{r.modelVersion}</StatusPill>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
