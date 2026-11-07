"use client";
import * as React from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { DateField } from "@/components/primitives/date-field";
import { NumberField } from "@/components/primitives/number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type AdminInvoiceForm, adminInvoiceFormSchema } from "@/constant/schemas/admin-account";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, Briefcase01Icon, Building03Icon, PaintBoardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CATEGORY_LABELS, TEMPLATE_LABELS } from "../../_data";
import { InvoiceDocument, openInvoice } from "../../_invoice-preview";
import { useAccount } from "../../_store";

const TEMPLATES = [
  { value: "web-design", icon: PaintBoardIcon, hint: "Design and build work" },
  { value: "consulting", icon: Briefcase01Icon, hint: "Advisory and hours" },
  { value: "property-management", icon: Building03Icon, hint: "Estates and upkeep" },
] as const;

const TEXT_FIELDS = [
  { name: "companyName", label: "Company name", placeholder: "Max Inc.", autoComplete: "organization", type: "text" },
  { name: "email", label: "Contact email", placeholder: "accounts@company.com", autoComplete: "email", type: "email" },
  { name: "phone", label: "Contact number", placeholder: "+234 801 234 5678", autoComplete: "tel", type: "tel" },
] as const;

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border p-5 first:border-none">
      <h2 className="flex items-center gap-2.5 text-base font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background tabular-nums">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function NewInvoicePage() {
  const router = useRouter();
  const { invoices, ready, save } = useAccount();
  const [saved, setSaved] = React.useState(false);
  const form = useForm<AdminInvoiceForm>({
    resolver: zodResolver(adminInvoiceFormSchema),
    mode: "onTouched",
    defaultValues: {
      template: "web-design",
      category: "design",
      invoiceNumber: "",
      dueDate: "",
      companyName: "",
      address: "",
      email: "",
      phone: "",
      amount: 0,
      rate: 0,
      description: "",
    },
  });
  const draft = useWatch({ control: form.control });

  // Suggest the next free number once saved invoices have loaded, unless one was already typed.
  React.useEffect(() => {
    if (!ready || form.getValues("invoiceNumber")) return;
    const highest = Math.max(0, ...invoices.map((invoice) => Number(invoice.invoiceNumber)).filter(Number.isFinite));
    if (highest) form.setValue("invoiceNumber", String(highest + 1));
  }, [ready, invoices, form]);

  function submit(values: AdminInvoiceForm, intent: "draft" | "send") {
    if (invoices.some((invoice) => invoice.invoiceNumber.toLowerCase() === values.invoiceNumber.toLowerCase())) {
      form.setError("invoiceNumber", { message: "This invoice number already exists" });
      return;
    }
    const invoice = {
      ...values,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "draft" as const,
    };
    if (!save(invoice)) return;
    setSaved(true);
    form.reset(values);
    if (intent === "draft") {
      toast.success("Invoice saved as a draft.");
      router.push("/account/invoices");
      return;
    }
    AppModal.open({
      title: "Saved as a draft. Nothing was sent",
      description: "Email delivery isn't connected yet.",
      content: (
        <p className="text-sm/6 text-muted-foreground">
          Open the invoice to print it or save it as a PDF and share it yourself. Connecting the billing API will send
          invoices and track delivery.
        </p>
      ),
      primaryButton: { children: "View invoices", onClick: () => router.push("/account/invoices") },
      secondaryButton: { children: "Open invoice", onClick: () => setTimeout(() => openInvoice(invoice), 0) },
    });
  }

  const isLocked = !ready || saved || form.formState.isSubmitting;

  return (
    <>
      <Link
        href="/account/invoices"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden className="size-4" />
        Invoices
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
        <p className="text-sm text-muted-foreground">
          The preview updates as you type. Invoices save in this browser; email delivery isn&apos;t connected.
        </p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="min-w-0 gap-0 rounded-2xl py-0 ring-foreground/8">
          <form noValidate onSubmit={form.handleSubmit((values) => submit(values, "send"))}>
            <Section step={1} title="Template">
              <Controller
                control={form.control}
                name="template"
                render={({ field }) => (
                  <RadioGroup
                    aria-label="Template"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="sm:grid-cols-3"
                  >
                    {TEMPLATES.map(({ value, icon, hint }) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <HugeiconsIcon icon={icon} aria-hidden className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{TEMPLATE_LABELS[value]}</span>
                          <span className="block text-xs text-muted-foreground">{hint}</span>
                        </span>
                        <RadioGroupItem value={value} className="mt-0.5" />
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    id="invoice-category"
                    label="Category"
                    error={fieldState.error?.message}
                    className="sm:max-w-xs"
                    items={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
                  />
                )}
              />
            </Section>

            <Section step={2} title="Client">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="invoice-invoiceNumber"
                      label="Invoice number"
                      placeholder="526551"
                      error={fieldState.error?.message}
                      helpText="Suggested from your latest invoice."
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="dueDate"
                  render={({ field, fieldState }) => (
                    <DateField
                      {...field}
                      id="invoice-dueDate"
                      label="Due date"
                      placeholder="Select date"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {TEXT_FIELDS.map(({ name, label, placeholder, autoComplete, type }) => (
                  <Controller
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        id={`invoice-${name}`}
                        label={label}
                        placeholder={placeholder}
                        type={type}
                        autoComplete={autoComplete}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                ))}
                <Controller
                  control={form.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="invoice-address"
                      label="Company address"
                      placeholder="4517 Washington Avenue, Lagos"
                      autoComplete="street-address"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </Section>

            <Section step={3} title="Service">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field, fieldState }) => (
                    <NumberField
                      {...field}
                      id="invoice-amount"
                      label="Amount"
                      prefix="₦"
                      allowDecimal
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="rate"
                  render={({ field, fieldState }) => (
                    <NumberField
                      {...field}
                      id="invoice-rate"
                      label="Rate (%)"
                      allowDecimal
                      helpText="Recorded on the invoice. It doesn't add tax."
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <TextAreaField
                      {...field}
                      id="invoice-description"
                      label="Description"
                      placeholder="What you're billing for"
                      className="sm:col-span-2"
                      textareaClassName="min-h-24"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </Section>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 p-5">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full px-4"
                nativeButton={false}
                render={<Link href="/account/invoices" />}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4"
                disabled={isLocked}
                onClick={form.handleSubmit((values) => submit(values, "draft"))}
              >
                Save draft
              </Button>
              <Button type="submit" className="h-10 rounded-full px-5" disabled={isLocked}>
                Send invoice
              </Button>
            </div>
          </form>
        </Card>

        <aside className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-24">
          <p className="text-xs text-muted-foreground">Live preview</p>
          <InvoiceDocument
            invoice={{
              ...draft,
              amount: Number(draft.amount) || 0,
              rate: Number(draft.rate) || 0,
            }}
          />
        </aside>
      </div>
    </>
  );
}
