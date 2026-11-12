"use client";

import { useState } from "react";

import { useCurrentUser, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from "@/actions/auth";
import { useKycState } from "@/actions/kyc";
import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { COMPANY_TYPES } from "@/constant/corporate-onboarding";
import type { AuthUser } from "@/constant/schemas/auth";
import { profilePhotoFileSchema } from "@/constant/schemas/settings";
import { phoneNumberFromE164, phoneNumberToE164 } from "@/lib/phone-number";
import { useKycStatus } from "@/lib/verification-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { countries } from "countries-list";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { CompanyProfileCard } from "../_corporate-home";
import { type AddressValues, type ProfileValues, addressSchema, profileSchema } from "./_schemas";
import { useSettings } from "./_settings-provider";
import { FormActions, SettingsNavigation, SettingsPanel } from "./_shared";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const profileValues = (user: AuthUser): ProfileValues => {
  const [firstName = "", ...rest] = user.name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
    phone: phoneNumberFromE164(user.phone),
    gender: user.gender === "other" ? null : (user.gender ?? null),
  };
};

const addressValues = (user: AuthUser): AddressValues => ({
  country: user.address?.country ?? "NG",
  address1: user.address?.line1 ?? "",
  address2: user.address?.line2 ?? "",
  city: user.address?.city ?? "",
  state: user.address?.state ?? "",
  zip: user.address?.postalCode ?? "",
});

const showError = (error: Error) => toast.error(error.message);

function ProfilePhoto({
  user,
  label = "Profile photo",
  className,
}: {
  user: AuthUser;
  label?: string;
  className?: string;
}) {
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const isBusy = uploadAvatar.isPending || removeAvatar.isPending;

  const upload = () =>
    AppModal.open({
      title: `Upload ${label.toLowerCase()}`,
      description: "A JPG, PNG or WebP up to 5 MB.",
      content: (
        <FileUpload
          id="profile-photo-upload"
          browseLabel="Choose image"
          dropzoneAccept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
          dropzoneMaxSize={5 * 1024 * 1024}
          dropzoneMaxFiles={1}
          onFilesAdded={(files) => {
            const parsed = profilePhotoFileSchema.safeParse(files[0]);
            if (!parsed.success) return;
            AppModal.close();
            uploadAvatar.mutate(parsed.data, {
              onSuccess: () => toast.success(`${label} updated`),
              onError: showError,
            });
          }}
          onFilesRejected={() => toast.error("Choose one JPG, PNG or WebP image smaller than 5 MB.")}
        />
      ),
    });

  return (
    <div className={cn("flex flex-wrap items-center gap-4 border-b border-border pb-5", className)}>
      <Avatar className="size-16">
        {user.avatar && <AvatarImage src={user.avatar} alt={label} />}
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">JPG, PNG or WebP up to 5 MB</p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-full px-4"
          onClick={upload}
          isLoading={uploadAvatar.isPending}
          disabled={isBusy}
        >
          {user.avatar ? "Change image" : "Upload image"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-full px-3"
          disabled={!user.avatar || isBusy}
          onClick={() =>
            removeAvatar.mutate(undefined, {
              onSuccess: () => toast.success(`${label} removed`),
              onError: showError,
            })
          }
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function ProfileForm({ user, corporate = false }: { user: AuthUser; corporate?: boolean }) {
  const updateProfile = useUpdateProfile();
  const { data: kyc } = useKycState();
  const nameLocked = user.kycCompleted;
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileValues(user),
    mode: "onTouched",
  });

  const save = form.handleSubmit(({ firstName, lastName, phone, gender }) =>
    updateProfile.mutate(
      {
        ...(!nameLocked && { name: `${firstName} ${lastName}` }),
        phone: phone.number.trim() ? phoneNumberToE164(phone) : null,
        ...(!corporate && { gender }),
      },
      {
        onSuccess: (saved) => {
          form.reset(profileValues(saved));
          toast.success("Profile saved");
        },
        onError: showError,
      }
    )
  );

  return (
    <SettingsPanel
      title={corporate ? "Your details" : "Account Settings"}
      description={
        corporate
          ? `You sign in and act for ${kyc?.business?.companyName ?? "your company"}. Your name follows your verified ID.`
          : undefined
      }
    >
      <form className="space-y-5" noValidate onSubmit={save}>
        {!corporate && <ProfilePhoto user={user} />}
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
                  readOnly={nameLocked}
                  helpText={nameLocked ? "Matches your verified ID" : undefined}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
          <TextField
            id="profile-email"
            type="email"
            label="Email"
            value={user.email}
            onChange={() => undefined}
            readOnly
            helpText={user.emailVerified ? "Verified" : "Not verified yet"}
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
        {!corporate && (
          <Controller
            control={form.control}
            name="gender"
            render={({ field, fieldState }) => (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Gender</legend>
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-label="Gender"
                  className="flex flex-wrap gap-2"
                >
                  {GENDER_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
                    >
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </fieldset>
            )}
          />
        )}
        <FormActions
          onCancel={() => form.reset(profileValues(user))}
          disabled={!form.formState.isDirty}
          isPending={updateProfile.isPending}
        />
      </form>
    </SettingsPanel>
  );
}

export function ProfileCard({ corporate = false }: { corporate?: boolean }) {
  const { data: user } = useCurrentUser();
  return user ? <ProfileForm key={user.id} user={user} corporate={corporate} /> : null;
}

const STATUS_LABELS = {
  verified: "Verified business",
  pending: "Verification in review",
  actionRequired: "Needs attention",
  notStarted: "Not verified",
} as const;

function CompanyCard() {
  const { data: user } = useCurrentUser();
  const { data: kyc } = useKycState();
  const status = useKycStatus();
  const business = kyc?.business;
  const type = COMPANY_TYPES.find((option) => option.value === business?.companyType);
  if (!user) return null;

  return (
    <SettingsPanel title="Company" description="Name and registration come from your CAC record.">
      <div className="space-y-4">
        <div>
          <p className="text-xl font-semibold tracking-tight">{business?.companyName ?? "No business on file yet"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {business && type && (
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium tabular-nums">
                {type.prefix} {business.registrationNumber}
              </span>
            )}
            {type && <span className="rounded-full bg-muted px-2.5 py-1">{type.label}</span>}
            {status && <span className="rounded-full bg-muted px-2.5 py-1">{STATUS_LABELS[status]}</span>}
          </div>
        </div>
        <ProfilePhoto user={user} label="Company logo" className="border-none pb-0" />
      </div>
    </SettingsPanel>
  );
}

const COUNTRY_OPTIONS = Object.entries(countries)
  .map(([value, country]) => ({ value, label: country.name }))
  .sort((a, b) => a.label.localeCompare(b.label));
function AddressForm({ user }: { user: AuthUser }) {
  const updateProfile = useUpdateProfile();
  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressValues(user),
    mode: "onTouched",
  });

  const save = form.handleSubmit((values) =>
    updateProfile.mutate(
      {
        address: {
          line1: values.address1,
          line2: values.address2 || null,
          city: values.city,
          lga: values.country === user.address?.country ? (user.address?.lga ?? null) : null,
          state: values.state,
          country: values.country,
          postalCode: values.zip || null,
        },
      },
      {
        onSuccess: (saved) => {
          form.reset(addressValues(saved));
          toast.success("Address saved");
        },
        onError: showError,
      }
    )
  );

  return (
    <SettingsPanel title="Address">
      <form className="space-y-4" noValidate onSubmit={save}>
        <Controller
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <SelectField
              {...field}
              id="address-country"
              label="Country"
              placeholder="Select country"
              items={COUNTRY_OPTIONS}
              error={fieldState.error?.message}
            />
          )}
        />
        {(
          [
            {
              name: "address1",
              label: "Address",
              autoComplete: "address-line1",
              placeholder: "House number and street",
            },
            { name: "address2", label: "Address 2 (optional)", autoComplete: "address-line2", placeholder: "" },
            { name: "city", label: "City", autoComplete: "address-level2", placeholder: "e.g. Ikeja" },
            { name: "state", label: "State", autoComplete: "address-level1", placeholder: "e.g. Lagos" },
            { name: "zip", label: "Postal code (optional)", autoComplete: "postal-code", placeholder: "" },
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
                placeholder={item.placeholder}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
        <FormActions
          onCancel={() => form.reset(addressValues(user))}
          disabled={!form.formState.isDirty}
          isPending={updateProfile.isPending}
        />
      </form>
    </SettingsPanel>
  );
}

export function AddressCard() {
  const { data: user } = useCurrentUser();
  return user ? <AddressForm key={user.id} user={user} /> : null;
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
export function DeleteAccountCard({ corporate = false }: { corporate?: boolean }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <SettingsPanel
      title={corporate ? "Close company account" : "Delete your account"}
      description={
        corporate
          ? "Closing the account removes access for everyone acting for the company and schedules deletion of its data, with a 14-day cancellation window. Account closure is unavailable in this preview."
          : "Deleting your account removes access to account services and schedules deletion of personal data, with a 14-day cancellation window. Account deletion is unavailable in this preview."
      }
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

const CHANNELS = [
  { key: "emailNotifications", label: "Email", description: "Account activity and updates by email" },
  { key: "smsNotifications", label: "SMS", description: "Text messages to your phone" },
  { key: "pushNotifications", label: "Push", description: "Alerts on your devices" },
] as const;

function NotificationPreferencesCard() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const preferences = {
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
  };

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose how we reach you. Essential account and security messages are always sent."
    >
      <ul className="divide-y divide-border">
        {CHANNELS.map(({ key, label, description }) => (
          <li key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <label htmlFor={`notify-${key}`} className="min-w-0 cursor-pointer">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </label>
            <Switch
              id={`notify-${key}`}
              checked={preferences[key]}
              disabled={!user || updateProfile.isPending}
              onCheckedChange={(checked) =>
                updateProfile.mutate({ preferences: { ...preferences, [key]: checked } }, { onError: showError })
              }
            />
          </li>
        ))}
      </ul>
    </SettingsPanel>
  );
}

function VerifyButton() {
  const { data: user } = useCurrentUser();
  const { data: kyc } = useKycState();
  if (!user || !kyc || user.kycCompleted || kyc.status === "in_review" || kyc.status === "approved") return null;
  const label =
    kyc.status === "rejected"
      ? "Review verification"
      : user.accountType === "corporate"
        ? "Verify business"
        : "Verify identity";
  return (
    <Button className="h-10 rounded-full px-5" render={<Link href="/dashboard/onboarding" />} nativeButton={false}>
      {label}
    </Button>
  );
}

export default function Client$SettingsPage() {
  const { data: user } = useCurrentUser();
  const corporate = user?.accountType === "corporate";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SettingsNavigation />
        <VerifyButton />
      </div>
      {corporate ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <CompanyCard />
            <ProfileCard corporate />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <CompanyProfileCard className="rounded-2xl ring-1 ring-foreground/8" />
            <NotificationPreferencesCard />
            <DeleteAccountCard corporate />
          </div>
        </div>
      ) : (
        <PersonalSettings />
      )}
    </>
  );
}

function PersonalSettings() {
  return (
    <>
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
