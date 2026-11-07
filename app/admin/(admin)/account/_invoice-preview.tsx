"use client";

import { AppModal } from "@/components/primitives/app-modal";
import { Button } from "@/components/ui/button";
import type { AdminInvoice } from "@/constant/schemas/admin-account";
import { Copy01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import { toast } from "sonner";

import { CATEGORY_LABELS, TEMPLATE_LABELS, dueLabel, money } from "./_data";
import { INVOICE_TONES, StatusPill, formatDate } from "./_ui";

/** What the document needs. A draft being typed can have blanks, so everything is optional except the money. */
export type InvoiceDocumentData = Partial<Omit<AdminInvoice, "amount" | "rate">> & { amount: number; rate: number };

function Field({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("mt-1 truncate text-sm font-semibold", !value && "font-normal text-muted-foreground/60")}>
        {value || "—"}
      </dd>
    </div>
  );
}

/** The invoice itself, shared by the preview, the live preview while writing one, and the printed copy. */
export function InvoiceDocument({ invoice, className }: { invoice: InvoiceDocumentData; className?: string }) {
  const due = invoice.dueDate ? dueLabel(invoice.dueDate) : null;

  return (
    <article className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8", className)}>
      <header className="flex items-start justify-between gap-4 bg-[#121212] p-5 text-white">
        <div className="flex items-center gap-2.5">
          <Image src="/assets/images/logo.png" alt="" width={34} height={40} className="size-8 object-contain" />
          <div>
            <p className="text-sm font-semibold">City Core</p>
            <p className="text-xs text-white/60">Invoice</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Invoice no.</p>
          <p className="text-base font-semibold tabular-nums">#{invoice.invoiceNumber || "—"}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {invoice.status ? (
            <StatusPill tone={INVOICE_TONES[invoice.status]}>{invoice.status}</StatusPill>
          ) : (
            <StatusPill tone="muted">Not saved</StatusPill>
          )}
          {due && invoice.status !== "paid" && (
            <p className={cn("text-xs", due.isOverdue ? "text-destructive" : "text-muted-foreground")}>{due.text}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Billed to" value={invoice.companyName} className="col-span-2" />
          <div className="col-span-2 -mt-3 text-xs/5 text-muted-foreground">
            {[invoice.address, invoice.email, invoice.phone].filter(Boolean).join(" · ") || "Address and contact"}
          </div>
          <Field label="Issued" value={invoice.createdAt ? formatDate(invoice.createdAt) : undefined} />
          <Field label="Due" value={invoice.dueDate ? formatDate(invoice.dueDate) : undefined} />
          <Field label="Template" value={invoice.template ? TEMPLATE_LABELS[invoice.template] : undefined} />
          <Field label="Category" value={invoice.category ? CATEGORY_LABELS[invoice.category] : undefined} />
        </dl>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Service</p>
              <p className={cn("mt-1 text-sm/6 wrap-break-word", !invoice.description && "text-muted-foreground/60")}>
                {invoice.description || "What you're billing for"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">Rate {invoice.rate || 0}%</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{money(invoice.amount || 0)}</p>
          </div>
        </div>

        <dl className="ml-auto flex w-full max-w-60 flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money(invoice.amount || 0)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>Tax</dt>
            <dd className="tabular-nums">{money(0)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="text-xl font-light tabular-nums">{money(invoice.amount || 0)}</dd>
          </div>
        </dl>

        <p className="text-[11px]/4 text-muted-foreground">
          Illustrative invoice. The rate is service metadata; no tax is added.
        </p>
      </div>
    </article>
  );
}

/** Opens a print window with a plain copy. Built from text nodes, so invoice fields can't inject markup. */
export function printInvoice(invoice: AdminInvoice) {
  const popup = window.open("", "_blank", "width=820,height=900");
  if (!popup) {
    toast.error("Allow pop-ups to print or save this invoice as PDF.");
    return;
  }
  const doc = popup.document;
  doc.title = `Invoice ${invoice.invoiceNumber}`;
  const style = doc.createElement("style");
  style.textContent = [
    "body{font:14px/1.6 Lato,system-ui,sans-serif;color:#121212;margin:0;padding:48px}",
    "header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #121212;padding-bottom:16px}",
    "h1{font-size:28px;font-weight:300;margin:0}.muted{color:#6c635a}.label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6c635a}",
    "section{margin-top:28px}.row{display:flex;justify-content:space-between;gap:24px;padding:6px 0}",
    ".total{border-top:1px solid #e4dbd1;margin-top:8px;padding-top:12px;font-size:20px}",
  ].join("");
  doc.head.append(style);

  const add = (parent: HTMLElement, tag: string, text = "", className = "") => {
    const element = doc.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  };
  const header = add(doc.body, "header");
  const brand = add(header, "div");
  add(brand, "div", "City Core", "label");
  add(brand, "h1", "Invoice");
  const meta = add(header, "div");
  add(meta, "div", `#${invoice.invoiceNumber}`);
  add(meta, "div", invoice.status.toUpperCase(), "muted");

  const billed = add(doc.body, "section");
  add(billed, "div", "Billed to", "label");
  add(billed, "div", invoice.companyName);
  add(billed, "div", `${invoice.address} · ${invoice.email} · ${invoice.phone}`, "muted");

  const dates = add(doc.body, "section");
  for (const [label, value] of [
    ["Issued", formatDate(invoice.createdAt)],
    ["Due", formatDate(invoice.dueDate)],
    ["Template", TEMPLATE_LABELS[invoice.template]],
  ]) {
    const row = add(dates, "div", "", "row");
    add(row, "span", label, "muted");
    add(row, "span", value);
  }

  const service = add(doc.body, "section");
  add(service, "div", "Service", "label");
  const line = add(service, "div", "", "row");
  add(line, "span", `${invoice.description} (rate ${invoice.rate}%)`);
  add(line, "span", money(invoice.amount));
  const total = add(service, "div", "", "row total");
  add(total, "span", "Total");
  add(total, "span", money(invoice.amount));

  add(doc.body, "p", "Illustrative invoice. The rate is service metadata; no tax is added.", "muted");
  popup.focus();
  popup.print();
}

export function copyInvoiceNumber(invoice: AdminInvoice) {
  navigator.clipboard
    .writeText(invoice.invoiceNumber)
    .then(() => toast.success(`Copied #${invoice.invoiceNumber}.`))
    .catch(() => toast.error("Clipboard access is unavailable."));
}

export function openInvoice(invoice: AdminInvoice) {
  AppModal.open({
    title: invoice.description,
    description: `${invoice.companyName} · #${invoice.invoiceNumber}`,
    content: <InvoiceDocument invoice={invoice} />,
    footer: (
      <div className="flex w-full flex-wrap justify-end gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => copyInvoiceNumber(invoice)}>
          <HugeiconsIcon icon={Copy01Icon} aria-hidden />
          Copy number
        </Button>
        <Button className="rounded-full" onClick={() => printInvoice(invoice)}>
          <HugeiconsIcon icon={PrinterIcon} aria-hidden />
          Print or save PDF
        </Button>
      </div>
    ),
  });
}
