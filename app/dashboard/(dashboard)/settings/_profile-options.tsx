"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { countries } from "countries-list";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { type AddressValues, addressSchema } from "./_schemas";
import { useSettings } from "./_settings-provider";
import { FormActions, SettingsPanel } from "./_shared";

const COUNTRY_OPTIONS = Object.entries(countries)
  .map(([value, country]) => ({ value, label: country.name }))
  .sort((a, b) => a.label.localeCompare(b.label));
export function AddressCard() {
  const settings = useSettings();
  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: settings.address,
    mode: "onTouched",
  });
  return (
    <SettingsPanel title="Address">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          settings.setAddress(values);
          form.reset(values);
          toast.success("Address saved for this settings session.");
        })}
      >
        <Controller
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <SelectField
              {...field}
              id="address-country"
              label="Location"
              placeholder="Select country"
              items={COUNTRY_OPTIONS}
              error={fieldState.error?.message}
            />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {(
            [
              { name: "address1", label: "Address 1", autoComplete: "address-line1" },
              { name: "address2", label: "Address 2 (optional)", autoComplete: "address-line2" },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id={`address-${item.name}`}
                  label={item.label}
                  autoComplete={item.autoComplete}
                  placeholder="Enter address"
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
        </div>
        <Controller
          control={form.control}
          name="zip"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="address-zip"
              label="Zip / postal code"
              autoComplete="postal-code"
              placeholder="Enter code"
              error={fieldState.error?.message}
            />
          )}
        />
        <FormActions onCancel={() => form.reset(settings.address)} />
      </form>
    </SettingsPanel>
  );
}
export function PrivacyCard() {
  const settings = useSettings();
  const [visibility, setVisibility] = useState(settings.visibility);
  return (
    <SettingsPanel title="Privacy">
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          settings.setVisibility(visibility);
          toast.success("Privacy preference saved for this settings session.");
        }}
      >
        <SelectField
          id="photo-visibility"
          label="Who can see your profile photo?"
          value={visibility}
          onChange={setVisibility}
          items={[
            { value: "anyone", label: "Anyone" },
            { value: "members", label: "City Core members" },
            { value: "private", label: "Only me" },
          ]}
        />
        <FormActions onCancel={() => setVisibility(settings.visibility)} />
      </form>
    </SettingsPanel>
  );
}
function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed">
        Account deletion is not connected yet. In the live product, deletion removes access and starts the disclosed
        14-day cancellation period. No account or personal data will be deleted in this preview.
      </p>
      <TextField
        id="delete-account-confirmation"
        label="Type DELETE to confirm"
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="off"
      />
      <Button
        variant="destructive"
        disabled={confirmation !== "DELETE"}
        onClick={() => {
          toast.info("Account deletion is unavailable until account services are connected. Nothing has been deleted.");
          AppModal.close();
        }}
      >
        Confirm deletion request
      </Button>
    </div>
  );
}
export function DeleteAccountCard() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <SettingsPanel
      title="Delete your account"
      description="Deleting your account removes access to account services and schedules deletion of personal data, with a 14-day cancellation window. Account deletion is unavailable in this preview."
      className="ring-destructive/25"
    >
      <label className="flex cursor-pointer items-start gap-3 text-sm/5">
        <Checkbox checked={confirmed} onCheckedChange={setConfirmed} className="mt-0.5" />I confirm that I want to
        delete my account.
      </label>
      <Button
        variant="outline"
        className="h-10 self-start rounded-full px-5 text-destructive"
        disabled={!confirmed}
        onClick={() =>
          AppModal.open({
            title: "Delete your account?",
            description: "Review this request carefully.",
            content: <DeleteAccountDialog />,
            secondaryButton: { children: "Keep my account" },
          })
        }
      >
        Delete account
      </Button>
    </SettingsPanel>
  );
}
