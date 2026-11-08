"use client";

import { useRef, useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_TOPIC_LABELS,
  type NotificationTopic,
} from "@/constant/notifications";
import { profilePhotoFileSchema } from "@/constant/schemas/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  QuoteDownIcon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { countries } from "countries-list";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { type AddressValues, type ProfileValues, addressSchema, profileSchema } from "./_schemas";
import { useSettings } from "./_settings-provider";
import { FormActions, SettingsNavigation, SettingsPanel } from "./_shared";

const TOOLS = [
  { label: "Bold", icon: TextBoldIcon, before: "**", after: "**" },
  { label: "Italic", icon: TextItalicIcon, before: "_", after: "_" },
  { label: "Bullet list", icon: LeftToRightListBulletIcon, before: "\n- ", after: "" },
  { label: "Numbered list", icon: LeftToRightListNumberIcon, before: "\n1. ", after: "" },
  { label: "Quote", icon: QuoteDownIcon, before: "\n> ", after: "" },
  { label: "Link", icon: Link01Icon, before: "[", after: "](https://)" },
];

function TaglineField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = "") => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    if (next.length > 500) return;
    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + before.length, end + before.length);
    });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="profile-tagline">Tagline</Label>
      <div className="overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <div
          role="toolbar"
          aria-label="Tagline formatting"
          className="flex flex-wrap gap-0.5 border-b border-border p-1"
        >
          {TOOLS.map(({ label, icon, before, after }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              onClick={() => insert(before, after)}
            >
              <HugeiconsIcon icon={icon} aria-hidden />
            </Button>
          ))}
        </div>
        <TextAreaField
          ref={ref}
          id="profile-tagline"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={500}
          placeholder="Write a little about yourself"
          error={error}
          errorClassName="px-3 pb-2"
          textareaClassName="min-h-28 rounded-none border-0 bg-transparent focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <p className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
        <span>Formatting uses Markdown</span>
        <span>{value.length}/500</span>
      </p>
    </div>
  );
}

export function ProfileCard() {
  const settings = useSettings();
  const [photo, setPhoto] = useState(settings.photo);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: settings.profile,
    mode: "onTouched",
  });
  const upload = () =>
    AppModal.open({
      title: "Upload profile photo",
      description: "Preview a JPG, PNG or WebP up to 5 MB. The image stays in this browser session.",
      content: (
        <FileUpload
          id="profile-photo-upload"
          browseLabel="Choose image"
          dropzoneAccept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
          dropzoneMaxSize={5 * 1024 * 1024}
          dropzoneMaxFiles={1}
          onFilesAdded={(files) => {
            const parsed = profilePhotoFileSchema.safeParse(files[0]);
            if (parsed.success) {
              setPhoto(settings.createPhoto(parsed.data));
              AppModal.close();
            }
          }}
          onFilesRejected={() => toast.error("Choose one JPG, PNG or WebP image smaller than 5 MB.")}
        />
      ),
    });
  const cancel = () => {
    form.reset(settings.profile);
    setPhoto(settings.photo);
  };
  return (
    <SettingsPanel title="Account Settings">
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => {
          settings.setProfile(values);
          settings.setPhoto(photo);
          form.reset(values);
          toast.success("Profile saved for this settings session.");
        })}
      >
        <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
          <Avatar className="size-16">
            <AvatarImage
              src={photo?.url ?? "/assets/images/settings/profile-placeholder.png"}
              alt="Profile photo preview"
            />
            <AvatarFallback>Photo</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-sm font-semibold">Profile photo</p>
            <p className="truncate text-xs text-muted-foreground">
              {photo ? `${photo.name} • preview only until saved` : "JPG, PNG or WebP up to 5 MB"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={upload}>
              Upload image
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-full px-3"
              disabled={!photo}
              onClick={() => setPhoto(null)}
            >
              Remove
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { name: "firstName", label: "First Name", autoComplete: "given-name" },
              { name: "lastName", label: "Last Name", autoComplete: "family-name" },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id={`profile-${item.name}`}
                  label={item.label}
                  autoComplete={item.autoComplete}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id="profile-email"
                type="email"
                label="Email"
                autoComplete="email"
                placeholder="you@example.com"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <PhoneNumberField
                {...field}
                id="profile-phone"
                label="Phone (optional)"
                inputPlaceholder="0802 345 6789"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="gender"
          render={({ field, fieldState }) => (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Gender</legend>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                aria-label="Gender"
                className="flex flex-wrap gap-2"
              >
                {["Male", "Female", "Prefer not to say"].map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
                  >
                    <RadioGroupItem value={value} />
                    {value}
                  </label>
                ))}
              </RadioGroup>
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </fieldset>
          )}
        />
        <Controller
          control={form.control}
          name="tagline"
          render={({ field, fieldState }) => <TaglineField {...field} error={fieldState.error?.message} />}
        />
        {(
          [
            { name: "privacy", label: "I acknowledge the privacy policy", href: "/dashboard/privacy" },
            { name: "terms", label: "I acknowledge the terms & conditions", href: "/dashboard/terms" },
          ] as const
        ).map((item) => (
          <Controller
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field, fieldState }) => (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border p-3.5 transition-colors has-aria-invalid:border-destructive/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60">
                  <label className="flex cursor-pointer items-start gap-3 text-sm/5">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={!!fieldState.error}
                      className="mt-0.5"
                    />
                    {item.label}
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-7 h-auto p-0 text-xs sm:ml-0"
                    onClick={() =>
                      AppModal.open({
                        title: item.name === "privacy" ? "Privacy policy" : "Terms & conditions",
                        description: "Document not available in this preview",
                        content: (
                          <p className="text-sm leading-relaxed">
                            The current document has not been connected yet. These checkboxes demonstrate the profile
                            form; they do not record legal acceptance.
                          </p>
                        ),
                        primaryButton: { children: "Close" },
                      })
                    }
                  >
                    Read {item.name === "privacy" ? "privacy policy" : "terms"}
                  </Button>
                </div>
                {fieldState.error && <p className="mt-1.5 text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
        ))}
        <FormActions onCancel={cancel} />
      </form>
    </SettingsPanel>
  );
}

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

const OPTIONAL_TOPICS: { topic: NotificationTopic; description: string }[] = [
  { topic: "wallet", description: "Deposits and withdrawals" },
  { topic: "investments", description: "New properties and investment activity" },
];

function NotificationPreferencesCard() {
  const [enabled, setEnabled] = useState<NotificationTopic[]>(DEFAULT_NOTIFICATION_PREFERENCES);
  return (
    <SettingsPanel
      title="Notifications"
      description="Choose which optional updates you want to receive. Essential account and security messages stay enabled."
    >
      <ul className="divide-y divide-border">
        {OPTIONAL_TOPICS.map(({ topic, description }) => (
          <li key={topic} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <label htmlFor={`notify-${topic}`} className="min-w-0 cursor-pointer">
              <span className="block text-sm font-semibold">{NOTIFICATION_TOPIC_LABELS[topic]}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </label>
            <Switch
              id={`notify-${topic}`}
              checked={enabled.includes(topic)}
              onCheckedChange={(checked) =>
                setEnabled((current) => (checked ? [...current, topic] : current.filter((t) => t !== topic)))
              }
            />
          </li>
        ))}
      </ul>
    </SettingsPanel>
  );
}

export default function Client$SettingsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SettingsNavigation />
        <Button className="h-10 rounded-full px-5" render={<Link href="/dashboard/onboarding" />} nativeButton={false}>
          Verify identity
        </Button>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ProfileCard />
        <div className="flex min-w-0 flex-col gap-5">
          <AddressCard />
          <NotificationPreferencesCard />
          <PrivacyCard />
          <DeleteAccountCard />
        </div>
      </div>
    </>
  );
}
