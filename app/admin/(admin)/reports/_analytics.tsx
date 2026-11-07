"use client";

import { INVESTMENTS } from "@/app/dashboard/(dashboard)/marketplace/_data";
import { DataTable } from "@/components/primitives/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { printPreview } from "@/lib/print-preview";
import { Download04Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { money } from "../_operations/treasury-ui";
import { SegmentBar, StatusPill } from "../account/_ui";

export function PropertyAnalytics() {
  const principal = INVESTMENTS.reduce((sum, i) => sum + i.allocatedUnits * i.unitPrice, 0);
  const allocated = INVESTMENTS.reduce((sum, i) => sum + i.allocatedUnits, 0);
  const capacity = INVESTMENTS.reduce((sum, i) => sum + i.totalUnits, 0);
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <div><h2 className="text-base font-semibold">Offering performance</h2><p className="mt-1 text-xs text-muted-foreground">Subscribed principal and allocation · {INVESTMENTS.length} properties</p></div>
      <DataTable data={INVESTMENTS} pageSize={8} showPagination={false} cellClassName="py-4" columns={[
        { accessorKey: "name", header: "Property", cell: ({ row }) => <Link href={`/investments/${row.original.id}`} className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"><Image src={`/assets/images/marketplace/${row.original.image}.png`} width={44} height={44} alt="" className="size-11 rounded-xl object-cover" /><span><span className="block font-semibold text-foreground group-hover:underline">{row.original.name}</span><span className="text-xs text-muted-foreground">{row.original.location}</span></span></Link> },
        { id: "allocation", header: "Allocation", cell: ({ row }) => <div className="min-w-28 space-y-2"><p className="text-xs tabular-nums">{row.original.allocatedUnits.toLocaleString()} / {row.original.totalUnits.toLocaleString()} units</p><SegmentBar className="h-1.5 bg-muted" parts={[{ key: 'allocated', value: row.original.allocatedUnits, className: 'bg-accent' }, { key: 'available', value: row.original.totalUnits - row.original.allocatedUnits, className: 'bg-muted' }]} /></div> },
        { id: "principal", header: "Principal", cell: ({ row }) => <span className="font-semibold text-foreground tabular-nums">{money(row.original.allocatedUnits * row.original.unitPrice)}</span> },
        { accessorKey: "annualRoi", header: "Target / year", cell: ({ row }) => <span className="tabular-nums">{row.original.annualRoi}%</span> },
      ]} />
      <p className="border-t border-border pt-4 text-xs/5 text-muted-foreground">Target ROI describes offering assumptions, not realized performance. Returns are not guaranteed; capital is at risk.</p>
    </Card>
    <Card className="gap-6 rounded-2xl px-5 py-5 ring-foreground/8">
      <div><h2 className="text-base font-semibold">Portfolio allocation</h2><p className="mt-1 text-xs text-muted-foreground">Platform totals · current offering snapshot</p></div>
      <div><p className="text-xs text-muted-foreground">Subscribed principal</p><p className="mt-2 break-words text-3xl font-light tabular-nums">{money(principal)}</p></div>
      <div className="space-y-3"><SegmentBar className="h-2.5 bg-muted" parts={[{ key: 'allocated', value: allocated, className: 'bg-accent' }, { key: 'available', value: capacity - allocated, className: 'bg-muted' }]} /><div className="flex justify-between text-xs text-muted-foreground"><span>{Math.round(allocated / capacity * 100)}% allocated</span><span>{(capacity - allocated).toLocaleString()} units available</span></div></div>
      <dl className="space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Allocated units</dt><dd className="font-semibold tabular-nums">{allocated.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Total capacity</dt><dd className="font-semibold tabular-nums">{capacity.toLocaleString()}</dd></div></dl>
      <Button nativeButton={false} variant="outline" render={<Link href="/investments" />} className="h-10 rounded-full">Manage offerings<HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden /></Button>
    </Card>
  </div>;
}
export function TaxAnalytics() {
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Card className="gap-6 rounded-2xl px-6 py-6 ring-foreground/8">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold">Distribution breakdown</h2><p className="mt-1 text-xs text-muted-foreground">October 2026 · DIV-010</p></div><StatusPill tone="muted">Illustrative schedule</StatusPill></div>
      <div><p className="text-sm text-muted-foreground">Gross distributions</p><p className="mt-2 text-4xl font-light tabular-nums">{money(240000)}</p></div>
      <SegmentBar className="h-3 bg-muted" parts={[{ key: 'net', value: 216000, className: 'bg-accent' }, { key: 'tax', value: 24000, className: 'bg-foreground/35' }]} />
      <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-accent" aria-hidden />Net wallet credits · 90%</p><p className="text-2xl font-light tabular-nums">{money(216000)}</p></div><div className="space-y-2"><p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-foreground/35" aria-hidden />Example withholding · 10%</p><p className="text-2xl font-light tabular-nums">{money(24000)}</p></div></div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-5"><Button className="h-10 rounded-full px-4" onClick={() => printPreview("Tax schedule preview", ["Batch: DIV-010 · October 2026", "Gross: ₦240,000", "Example withholding (10%): ₦24,000", "Net wallet credits: ₦216,000", "Illustrative only. Verify tax applicability before filing."])}><HugeiconsIcon icon={Download04Icon} aria-hidden />Print / Save PDF</Button><Button nativeButton={false} variant="outline" render={<Link href="/returns" />} className="h-10 rounded-full px-4">View distribution schedule</Button></div>
    </Card>
    <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8"><div><h2 className="text-base font-semibold">Before you file</h2><p className="mt-1 text-xs text-muted-foreground">This schedule is a reporting preview.</p></div><ol className="space-y-5">{["Verify the applicable tax rule and jurisdiction.", "Confirm the gross distribution and investor allocation.", "Obtain approval before filing or remitting tax."].map((step, i) => <li key={step} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span><p className="text-sm/6 text-muted-foreground">{step}</p></li>)}</ol><p className="border-t border-border pt-4 text-xs/5 text-muted-foreground">No tax return is submitted from this page. The example 10% rate is not tax advice.</p></Card>
  </div>;
}
