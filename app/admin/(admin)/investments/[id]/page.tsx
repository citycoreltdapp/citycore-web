"use client";

import * as React from "react";

import { PropertyDetails, PropertyHero } from "@/app/dashboard/(dashboard)/marketplace/[id]/page";
import { naira } from "@/app/dashboard/(dashboard)/marketplace/page";
import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { STAFF } from "../../_operations/data";
import { Notice, PageLink, PageTitle, Panel, StatusBadge } from "../../_operations/ui";
import { toProperty } from "../_data";
import { useAdminInvestments } from "../_store";

export default function InvestmentView() {
  const { id } = useParams<{ id: string }>();
  const { investments, ready, save } = useAdminInvestments();
  const investment = investments.find((i) => i.id === id);
  if (!ready) return <Skeleton className="h-96 rounded-2xl" />;
  if (!investment)
    return (
      <>
        <PageTitle title="Investment not found" description="This offering is unavailable in the local preview.">
          <PageLink href="/investments">All investments</PageLink>
        </PageTitle>
      </>
    );
  return (
    <>
      <PageTitle
        title="Investment View"
        description={`${investment.name} · ${investment.location}, ${investment.city}`}
      >
        <PageLink href="/investments">All investments</PageLink>
        <PageLink href={`/investments/${id}/edit`}>Edit investment</PageLink>
      </PageTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PropertyHero
          property={toProperty(investment)}
          headingAs="h2"
          statusLabel={investment.publicationStatus.replace("-", " ")}
        />
        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Panel title="Offering controls" description="Admin preview · no investor wallet actions">
            <StatusBadge value={investment.publicationStatus} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Units per investor</dt>
              <dd>
                {investment.minUnits}–{investment.maxUnits} · from {naira(investment.minUnits * investment.unitPrice)}
              </dd>
              <dt className="text-muted-foreground">Units sold</dt>
              <dd>
                {investment.unitsSold.toLocaleString()} / {investment.totalUnits.toLocaleString()}
              </dd>
              <dt className="text-muted-foreground">Offering starts</dt>
              <dd>{investment.startDate}</dd>
              <dt className="text-muted-foreground">Offering ends</dt>
              <dd>{investment.endDate}</dd>
              <dt className="text-muted-foreground">Publisher</dt>
              <dd>{STAFF.find((s) => s.id === investment.publisherId)?.name ?? "Unassigned"}</dd>
              <dt className="text-muted-foreground">Version</dt>
              <dd>v{investment.version}</dd>
            </dl>
            <PageLink href={`/investments/${id}/edit`}>Edit offering</PageLink>
            {investment.publicationStatus === "active" && (
              <Button
                variant="outline"
                onClick={() =>
                  AppModal.open({
                    title: `Pause ${investment.name}?`,
                    content: (
                      <Notice>
                        This marks the local preview as paused. Existing allocations are retained; no live offering is
                        changed.
                      </Notice>
                    ),
                    primaryButton: {
                      children: "Pause preview",
                      onClick: () => {
                        if (
                          save({
                            ...investment,
                            publicationStatus: "paused",
                            version: investment.version + 1,
                            updatedAt: new Date().toISOString(),
                          })
                        )
                          toast.success("Local offering paused");
                      },
                    },
                    secondaryButton: { children: "Cancel" },
                  })
                }
              >
                Pause investment
              </Button>
            )}
            {investment.publicationStatus !== "active" && (
              <Notice>
                {investment.publicationStatus === "pending-review"
                  ? "This offering is awaiting publication review. Existing investor allocations are unchanged."
                  : "Edit and submit this offering for publication review when it is ready."}
              </Notice>
            )}
          </Panel>
          <Notice>
            Target returns are projections, not guarantees. Prices, allocations and publication approvals must be
            checked by the server before live changes.
          </Notice>
        </aside>
        <PropertyDetails property={toProperty(investment)} />
      </div>
    </>
  );
}
