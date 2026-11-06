"use client";

import { AppModal } from "@/components/primitives/app-modal";

import { AGREEMENT_VERSION, type Investment } from "./_data";

export const RISK_TEXT =
  "Capital and returns are not guaranteed. Construction delays, title disputes, vacancy, valuation changes and liquidity constraints may reduce or delay payouts.";
export const EXIT_TEXT =
  "No on-demand withdrawal. Principal is intended to be returned at maturity, subject to asset realization. Early-exit requests require review, may incur disclosed costs and are not guaranteed.";

export function openInvestmentDocument(investment: Investment, document: "prospectus" | "agreement" | "risk") {
  AppModal.open({
    title: `${investment.name} · ${document === "risk" ? "Risk disclosure" : document === "agreement" ? "Investor agreement" : "Prospectus"}`,
    description: `Illustrative preview • version ${AGREEMENT_VERSION}`,
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Residential development in {investment.location}. Allocation funds acquisition and staged development of
          residential units, with quarterly progress updates against the offering milestones.
        </p>
        <p>
          {investment.tenure}-month term from allocation. Target simple annual ROI: {investment.annualRoi}%, before
          applicable taxes and costs. Returns are projections and do not compound.
        </p>
        <p>{RISK_TEXT}</p>
        <p>{EXIT_TEXT}</p>
        <p className="rounded-lg bg-muted p-3 text-muted-foreground">
          This is a design preview. The approved offering documents and legally binding agreement have not been
          connected yet.
        </p>
      </div>
    ),
    primaryButton: { children: "Close preview" },
  });
}
