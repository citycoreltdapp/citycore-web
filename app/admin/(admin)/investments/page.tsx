"use client";

import * as React from "react";

import { PropertyCard } from "@/app/dashboard/(dashboard)/marketplace/page";
import { SearchField } from "@/components/primitives/search-field";
import { SelectField } from "@/components/primitives/select-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Notice, PageLink, PageTitle } from "../_operations/ui";
import { toProperty } from "./_data";
import { useAdminInvestments } from "./_store";

const TRIGGER = "h-10! w-full rounded-full bg-card px-3.5 lg:w-auto lg:min-w-32";
export default function InvestmentManagement() {
  const { investments, ready } = useAdminInvestments();
  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [tenure, setTenure] = React.useState("all");
  const [sort, setSort] = React.useState("recent");
  const reset = () => {
    setSearch("");
    setLocation("all");
    setStatus("all");
    setTenure("all");
    setSort("recent");
  };
  const rows = investments
    .filter(
      (i) =>
        `${i.name} ${i.location} ${i.id}`.toLowerCase().includes(search.trim().toLowerCase()) &&
        (location === "all" || i.location === location) &&
        (status === "all" || i.publicationStatus === status) &&
        (tenure === "all" || i.tenureMonths === Number(tenure))
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "price-asc"
          ? a.unitPrice - b.unitPrice
          : b.updatedAt.localeCompare(a.updatedAt)
    );
  const filtered = search || [location, status, tenure].some((f) => f !== "all");
  return (
    <>
      <PageTitle
        title="Investment Management"
        description="Manage offerings, review availability and prepare publication changes."
      >
        <PageLink href="/investments/new">Add new investment</PageLink>
      </PageTitle>
      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchField
          id="admin-investment-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, location or ID"
          className="min-w-0 flex-1"
          groupClassName="h-10 bg-card dark:bg-card"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
          <SelectField
            id="admin-investment-location"
            value={location}
            onChange={setLocation}
            triggerAria-label="Location"
            triggerClassName={TRIGGER}
            items={[
              { value: "all", label: "All locations" },
              ...Array.from(new Set(investments.map((i) => i.location))).map((v) => ({ value: v, label: v })),
            ]}
          />
          <SelectField
            id="admin-investment-status"
            value={status}
            onChange={setStatus}
            triggerAria-label="Publication status"
            triggerClassName={TRIGGER}
            items={[
              { value: "all", label: "All statuses" },
              ...["active", "draft", "paused", "pending-review"].map((v) => ({ value: v, label: v.replace("-", " ") })),
            ]}
          />
          <SelectField
            id="admin-investment-tenure"
            value={tenure}
            onChange={setTenure}
            triggerAria-label="Tenure"
            triggerClassName={TRIGGER}
            items={[
              { value: "all", label: "Any tenure" },
              ...Array.from(new Set(investments.map((i) => i.tenureMonths)))
                .sort((a, b) => a - b)
                .map((v) => ({ value: String(v), label: `${v} months` })),
            ]}
          />
          <SelectField
            id="admin-investment-sort"
            value={sort}
            onChange={setSort}
            triggerAria-label="Sort offerings"
            triggerClassName={TRIGGER}
            items={[
              { value: "recent", label: "Recent" },
              { value: "name", label: "Name" },
              { value: "price-asc", label: "Lowest price" },
            ]}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <p role="status" className="text-muted-foreground">
          {rows.length} offerings
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        )}
      </div>
      {!ready ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((investment, index) => (
            <PropertyCard
              key={investment.id}
              property={toProperty(investment)}
              index={index}
              href={`/investments/${investment.id}`}
              statusLabel={investment.publicationStatus.replace("-", " ")}
            />
          ))}
        </div>
      ) : (
        <Card className="items-center gap-3 p-10 text-center">
          <h2 className="font-semibold">No investments match your filters</h2>
          <p className="text-sm text-muted-foreground">Try another name, location or publication status.</p>
          <Button variant="secondary" onClick={reset}>
            Clear filters
          </Button>
        </Card>
      )}
      <Notice>
        Illustrative offerings and browser-local changes. Publication requests do not change the live investor
        marketplace.
      </Notice>
    </>
  );
}
