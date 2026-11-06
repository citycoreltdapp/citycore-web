"use client";

import { useState } from "react";

import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

import { INVESTMENTS, WALLET_BALANCE, naira } from "./_data";
import { InvestmentCard } from "./_investment-card";

const FILTER_TRIGGER = "h-10! w-full rounded-full bg-card px-3.5 lg:w-auto lg:min-w-32";

export function Client$MarketplacePage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [roi, setRoi] = useState("all");
  const [tenure, setTenure] = useState("all");
  const [price, setPrice] = useState("all");
  const investments = INVESTMENTS.filter(
    (investment) =>
      `${investment.name} ${investment.location} ${investment.id} residential development`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (location === "all" || investment.location.endsWith(location)) &&
      (roi === "all" || investment.annualRoi === Number(roi)) &&
      (tenure === "all" || investment.tenure === Number(tenure)) &&
      (price === "all" || (price === "under" ? investment.unitPrice <= 150_000 : investment.unitPrice > 150_000))
  );
  const isFiltered = search !== "" || [location, roi, tenure, price].some((filter) => filter !== "all");
  const reset = () => {
    setSearch("");
    setLocation("all");
    setRoi("all");
    setTenure("all");
    setPrice("all");
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">New Investment Marketplace</h1>
          <p className="text-sm/6 text-muted-foreground">
            Properties and availability shown are illustrative. Target returns are projections, not a guarantee. Capital
            is at risk, so review the prospectus before investing.
          </p>
        </div>
        <Link href="/wallet" className="group/wallet shrink-0 sm:text-right">
          <span className="block text-xs text-muted-foreground">Available wallet</span>
          <span className="text-xl font-semibold tabular-nums group-hover/wallet:underline">
            {naira(WALLET_BALANCE)}
          </span>
        </Link>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchField
          id="investment-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, location or ID"
          className="min-w-0 flex-1"
          groupClassName="h-10 bg-card dark:bg-card"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
          <SelectField
            id="investment-location"
            value={location}
            onChange={setLocation}
            triggerAria-label="Location"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "All locations" },
              { value: "Lagos", label: "Lagos" },
              { value: "Abuja", label: "Abuja" },
            ]}
          />
          <SelectField
            id="investment-roi"
            value={roi}
            onChange={setRoi}
            triggerAria-label="Target annual ROI"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any ROI" },
              ...[12, 14, 16].map((value) => ({ value: String(value), label: `${value}% ROI` })),
            ]}
          />
          <SelectField
            id="investment-tenure"
            value={tenure}
            onChange={setTenure}
            triggerAria-label="Tenure"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any tenure" },
              { value: "12", label: "12 months" },
              { value: "18", label: "18 months" },
            ]}
          />
          <SelectField
            id="investment-price"
            value={price}
            onChange={setPrice}
            triggerAria-label="Unit price"
            triggerClassName={FILTER_TRIGGER}
            items={[
              { value: "all", label: "Any price" },
              { value: "under", label: "Up to ₦150,000" },
              { value: "over", label: "Above ₦150,000" },
            ]}
          />
        </div>
      </div>

      <div className="flex h-5 items-center justify-between gap-3 text-sm">
        <p role="status" className="text-muted-foreground tabular-nums">
          {investments.length} {investments.length === 1 ? "opportunity" : "opportunities"}
        </p>
        {isFiltered && investments.length > 0 && (
          <button type="button" onClick={reset} className="font-medium underline-offset-4 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {investments.map((investment, index) => (
          <InvestmentCard key={investment.id} investment={investment} index={index} />
        ))}
      </div>
      {investments.length === 0 && (
        <Card className="items-center gap-3 p-10 text-center">
          <h2 className="font-semibold">No investments match your filters</h2>
          <p className="text-sm text-muted-foreground">Try another name, location or investment range.</p>
          <Button variant="secondary" onClick={reset}>
            Clear filters
          </Button>
        </Card>
      )}
    </>
  );
}
