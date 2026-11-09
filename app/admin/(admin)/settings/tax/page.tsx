"use client";

import { NumberField } from "@/components/primitives/number-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminTaxSettings, adminTaxSettingsSchema } from "@/constant/schemas/admin-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { money } from "../../_operations/treasury-ui";
import { usePreviewState } from "../../_operations/use-preview-state";
import { TAX_DEFAULTS, TAX_SETTINGS_KEY } from "../../_operations/workspace-data";

const EXAMPLE_RETURN = 100_000;

export default function TaxSettings() {
  const store = usePreviewState(TAX_SETTINGS_KEY, adminTaxSettingsSchema, TAX_DEFAULTS);
  if (!store.ready) return <Skeleton className="h-80" />;
  return <TaxForm value={store.value} save={store.save} />;
}

function TaxForm({ value, save }: { value: AdminTaxSettings; save: (next: AdminTaxSettings) => boolean }) {
  const form = useForm<AdminTaxSettings>({ resolver: zodResolver(adminTaxSettingsSchema), defaultValues: value });
  const rate = Number(useWatch({ control: form.control, name: "withholdingRate" })) || 0;
  const withheld = Math.round(EXAMPLE_RETURN * rate) / 100;

  return (
    <form
      noValidate
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={form.handleSubmit((next) => {
        if (save(next)) {
          form.reset(next);
          toast.success("Withholding rate saved. New payout batches use it.");
        }
      })}
    >
      <Card className="gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
        <div>
          <h2 className="text-base font-semibold">Withholding tax</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deducted from every return before it reaches an investor&apos;s wallet. Principal is never taxed here.
          </p>
        </div>
        <Controller
          control={form.control}
          name="withholdingRate"
          render={({ field, fieldState }) => (
            <NumberField
              {...field}
              id="tax-withholding"
              label="Withholding rate (%)"
              allowDecimal
              helpText="Confirm the rate with your tax adviser before changing it."
              error={fieldState.error?.message}
              className="sm:max-w-xs"
            />
          )}
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          <Button type="submit" className="h-10 rounded-full px-5" disabled={!form.formState.isDirty}>
            Save rate
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full px-4"
            disabled={!form.formState.isDirty}
            onClick={() => form.reset(value)}
          >
            Discard
          </Button>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            Used by{" "}
            <Link href="/admin/returns" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Returns & Maturity
            </Link>
          </p>
        </div>
      </Card>

      <aside className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-[#121212] p-5 text-white ring-1 ring-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-accent/25 blur-3xl"
        />
        <p className="relative text-sm text-white/60">On a {money(EXAMPLE_RETURN)} return</p>
        <dl className="relative flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/60">Withheld at {rate}%</dt>
            <dd className="font-semibold tabular-nums">{money(withheld)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
            <dt className="text-white/60">Investor receives</dt>
            <dd className="text-xl font-light tabular-nums">{money(EXAMPLE_RETURN - withheld)}</dd>
          </div>
        </dl>
        <p className="relative text-xs/5 text-white/50">
          Saved in this browser for the preview. The live rate comes from platform configuration on the server.
        </p>
      </aside>
    </form>
  );
}
