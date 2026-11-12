"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import {
  useKycState,
  useLookupBusiness,
  useSaveBusinessDetails,
  useSavePayout,
  useSubmitKyc,
  useUploadAuthorisationLetter,
  useUploadCompanyLogo,
  useUploadUtilityBill,
  useVerifySignatory,
} from "@/actions/kyc";
import { BankLogo, BankSelectField, findBank } from "@/components/primitives/bank-select-field";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  COMPANY_LOGO_UPLOAD,
  COMPANY_TYPES,
  CORPORATE_DOCUMENT_UPLOAD,
  CORPORATE_ONBOARDING_DEFAULT_VALUES,
  CORPORATE_ONBOARDING_STEPS,
  type CacRecord,
  type CorporateOnboardingFormData,
  ID_TYPES,
  type IdType,
  REGISTRATION_NUMBER_PATTERN,
  companyTypePrefix,
  corporateOnboardingSchema,
} from "@/constant/corporate-onboarding";
import { NIN_PATTERN } from "@/constant/onboarding";
import type { KycBusiness, KycState } from "@/constant/schemas/kyc";
import { phoneNumberToE164, phoneNumberToString } from "@/lib/phone-number";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building06Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  LockIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Controller,
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

import {
  DocumentUpload,
  FIELD_STYLES,
  OnboardingSuccess,
  SectionLabel,
  StateAndLgaFields,
  StepIntro,
  StepRail,
  TopBar,
} from "./_shared";

const STEPS = CORPORATE_ONBOARDING_STEPS;
const LAST_STEP = STEPS.length - 1;
// Inputs with a prefix or a country picker sit in an input group, which FIELD_STYLES doesn't reach.
const CORPORATE_FIELD_STYLES = cn(
  FIELD_STYLES,
  "**:data-[slot=input-group]:h-12 **:data-[slot=input-group]:rounded-xl **:data-[slot=input-group]:bg-card **:data-[slot=input-group-control]:text-base"
);

const roleLabel = (role: string) => role.charAt(0) + role.slice(1).toLowerCase().replaceAll("_", " ");

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);

const toRecord = (business: KycBusiness): CacRecord => ({
  registrationNumber: business.registrationNumber,
  companyType: business.companyType,
  companyName: business.companyName,
  registeredOn: business.registeredOn,
  registeredAddress: business.registeredAddress,
  tin: business.tinFromRegistry ? business.tin : null,
  people: business.affiliates,
});

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

/* ------------------------------------------------------------------------------------------------
 * Step 1 · Company details
 * ---------------------------------------------------------------------------------------------- */

function CompanyTypePicker({ locked }: { locked: boolean }) {
  const { control } = useFormContext<CorporateOnboardingFormData>();
  return (
    <Controller
      control={control}
      name="companyType"
      render={({ field }) => (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Type of company</legend>
          <RadioGroup
            inputRef={field.ref}
            value={field.value}
            onValueChange={field.onChange}
            disabled={locked}
            className="grid-cols-1 gap-2 sm:grid-cols-6"
          >
            {COMPANY_TYPES.map(({ value, label, prefix, hint }, index) => (
              <label
                key={value}
                // Three across, then the two partnership types share the second row.
                className={cn(
                  index < 3 ? "sm:col-span-2" : "sm:col-span-3",
                  "group/option flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-3.5 transition-[border-color,box-shadow,background-color] hover:border-primary/30 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-data-checked:border-primary has-data-checked:bg-white has-data-checked:shadow-[0_1px_2px_rgba(18,18,18,0.06)] has-data-disabled:cursor-default has-data-disabled:not-has-data-checked:opacity-50 has-data-disabled:hover:border-border has-data-disabled:has-data-checked:hover:border-primary max-sm:flex-row max-sm:items-center"
                )}
              >
                <span className="flex items-center justify-between max-sm:order-last">
                  <span className="flex h-6 items-center rounded-md bg-secondary px-2 text-[11px] font-semibold tracking-wider text-primary/70 transition-colors group-has-data-checked/option:bg-primary group-has-data-checked/option:text-primary-foreground max-sm:hidden">
                    {prefix}
                  </span>
                  <RadioGroupItem value={value} className="focus-visible:ring-0" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    <span className="sm:hidden">{prefix} · </span>
                    {hint}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      )}
    />
  );
}

function CacRecordCard({ record }: { record: CacRecord }) {
  const type = COMPANY_TYPES.find((t) => t.value === record.companyType);
  const rows: [string, ReactNode][] = [
    ["Registration number", `${type?.prefix} ${record.registrationNumber}`],
    ["Type", type?.label],
    ["TIN", record.tin ?? <span className="font-normal text-muted-foreground">Not on file</span>],
    ["Registered", record.registeredOn ? formatDate(record.registeredOn) : "Not on record"],
    ["Registered address", record.registeredAddress ?? "Not on record"],
  ];
  return (
    <section
      aria-label="Your company on the CAC register"
      className="animate-in overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none"
    >
      <div className="relative overflow-hidden bg-[#121212] px-5 py-5 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
            <HugeiconsIcon icon={Building06Icon} aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-snug font-semibold">{record.companyName}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
              <span className="size-1.5 rounded-full bg-[#86c29b]" />
              Active on the CAC register
            </p>
          </div>
        </div>
      </div>
      <dl className="flex flex-col px-5 pt-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 border-b border-border py-3 text-sm last:border-none">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-center gap-2 border-t border-border bg-secondary/40 px-5 py-3 text-xs text-muted-foreground">
        <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3.5 shrink-0" />
        Locked to your CAC record. You&apos;ll confirm you&apos;re one of its {record.people.length}{" "}
        {record.people.length === 1 ? "listed person" : "listed people"} in the last step.
      </p>
    </section>
  );
}

function CompanyLogo() {
  const { control, setError, clearErrors } = useFormContext<CorporateOnboardingFormData>();
  const { field, fieldState } = useController({ control, name: "companyLogo" });
  const { data: kyc } = useKycState();
  const file = field.value;
  const [preview, setPreview] = useState(() => (file ? URL.createObjectURL(file) : null));

  const choose = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
    field.onChange(next);
  };

  const src = preview ?? kyc?.documents.companyLogo?.url ?? null;

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: COMPANY_LOGO_UPLOAD.accept,
    maxSize: COMPANY_LOGO_UPLOAD.maxSize,
    multiple: false,
    noClick: true,
    onDropAccepted: ([next]) => {
      clearErrors("companyLogo");
      choose(next);
    },
    onDropRejected: () => setError("companyLogo", { message: COMPANY_LOGO_UPLOAD.rejectedMessage }),
  });

  return (
    <section aria-label="Company logo" className="flex flex-col gap-3">
      <SectionLabel>Company logo (optional)</SectionLabel>
      <div
        {...getRootProps({
          className: cn(
            "flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors outline-none",
            isDragActive && "ring-accent"
          ),
        })}
      >
        <input {...getInputProps({ id: "companyLogo" })} />
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local preview or an uploaded logo URL
            <img src={src} alt="Company logo" className="size-full object-cover" />
          ) : (
            <HugeiconsIcon icon={Building06Icon} aria-hidden className="size-6" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{src ? "Your logo" : "Add your logo"}</span>
          <span className="block text-xs text-muted-foreground">
            {file ? file.name : "Shown on your account · JPEG, PNG or WebP up to 5 MB"}
          </span>
        </span>
        <div className="flex shrink-0 gap-1">
          {file && (
            <Button type="button" variant="ghost" onClick={() => choose(null)} className="h-9 rounded-full px-3">
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" onClick={open} className="h-9 rounded-full bg-card px-4">
            {src ? "Change" : "Upload"}
          </Button>
        </div>
      </div>
      {fieldState.error && (
        <p role="alert" className="text-sm text-destructive">
          {fieldState.error.message}
        </p>
      )}
    </section>
  );
}

function CompanyStep() {
  const { control, setValue, setError, clearErrors, getFieldState, formState } =
    useFormContext<CorporateOnboardingFormData>();
  const [companyType, registrationNumber, company, operatesAtRegisteredAddress] = useWatch({
    control,
    name: ["companyType", "registrationNumber", "company", "operatesAtRegisteredAddress"],
  });
  const lookupBusiness = useLookupBusiness();
  const prefix = companyTypePrefix(companyType);

  const findCompany = () => {
    const number = registrationNumber.trim();
    if (!REGISTRATION_NUMBER_PATTERN.test(number)) {
      setError(
        "registrationNumber",
        { message: "Enter the 4 to 8 digit number on your certificate" },
        { shouldFocus: true }
      );
      return;
    }
    clearErrors("registrationNumber");
    lookupBusiness.mutate(
      { companyType, registrationNumber: number },
      {
        onSuccess: ({ business }) => {
          if (!business) return;
          setValue("company", toRecord(business), { shouldValidate: true });
          setValue("signatoryName", "");
          setValue("signatoryIdNumber", "");
          setValue("signatoryVerifiedName", null);
          setValue("accountName", null);
          setValue("tin", "");
        },
        onError: (error) => setError("registrationNumber", { message: error.message }),
      }
    );
  };

  const changeCompany = () => {
    setValue("company", null, { shouldValidate: false });
    setValue("registrationNumber", "");
    setValue("signatoryName", "");
    setValue("signatoryIdNumber", "");
    setValue("signatoryVerifiedName", null);
    setValue("tin", "");
    requestAnimationFrame(() => document.getElementById("registrationNumber")?.focus());
  };

  const recordError = getFieldState("company", formState).error?.message;

  return (
    <>
      <StepIntro
        title="Find your company"
        subtitle="We’ll pull your details from the CAC register, then you add how we can reach you."
      />
      <div className="flex flex-col gap-5">
        <CompanyTypePicker locked={!!company} />
        <div className="flex flex-col gap-3">
          <Controller
            control={control}
            name="registrationNumber"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id="registrationNumber"
                label="CAC registration number"
                placeholder="1234567"
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
                readOnly={!!company}
                icon={<span className="pl-1 text-sm font-semibold tracking-wider text-foreground">{prefix}</span>}
                onChange={(v) => field.onChange(v.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !company) {
                    e.preventDefault();
                    void findCompany();
                  }
                }}
                error={fieldState.error?.message ?? (company ? undefined : recordError)}
                inputClassName="tracking-widest tabular-nums"
              />
            )}
          />
          {company ? (
            <button
              type="button"
              onClick={changeCompany}
              className="self-end text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Change company
            </button>
          ) : (
            <Button
              type="button"
              onClick={findCompany}
              isLoading={lookupBusiness.isPending}
              disabled={registrationNumber.length < 4}
              className="h-12 rounded-xl text-base"
            >
              {!lookupBusiness.isPending && <HugeiconsIcon icon={Search01Icon} aria-hidden data-icon="inline-start" />}
              Find my company
            </Button>
          )}
        </div>
      </div>

      {company && (
        <>
          <CacRecordCard record={company} />

          <CompanyLogo />

          <section aria-label={company.tin ? "Contact" : "Tax and contact"} className="flex flex-col gap-4">
            <SectionLabel>{company.tin ? "Contact" : "Tax & contact"}</SectionLabel>
            {!company.tin && (
              <Controller
                control={control}
                name="tin"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="tin"
                    label="Tax identification number (TIN)"
                    placeholder="12345678-0001"
                    inputMode="numeric"
                    maxLength={13}
                    autoComplete="off"
                    onChange={(v) => field.onChange(v.replace(/[^\d-]/g, ""))}
                    helpText="We couldn’t find a TIN linked to this business. It’s on your FIRS or JTB TIN certificate."
                    error={fieldState.error?.message}
                    inputClassName="tabular-nums"
                  />
                )}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="businessEmail"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="businessEmail"
                    type="email"
                    label="Business email"
                    placeholder="finance@company.com"
                    autoComplete="email"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="businessPhone"
                render={({ field, fieldState }) => (
                  <PhoneNumberField
                    {...field}
                    id="businessPhone"
                    label="Business phone"
                    inputPlaceholder="0802 345 6789"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </section>

          <section aria-label="Operating address" className="flex flex-col gap-4">
            <SectionLabel>Operating address</SectionLabel>
            <Controller
              control={control}
              name="operatesAtRegisteredAddress"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card/50 p-4 text-sm ring-1 ring-foreground/8">
                  <Checkbox
                    inputRef={field.ref}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5 size-5"
                  />
                  <span>
                    <span className="block font-medium">We operate from our registered address</span>
                    <span className="mt-0.5 block text-muted-foreground">{company.registeredAddress}</span>
                  </span>
                </label>
              )}
            />
            {!operatesAtRegisteredAddress && (
              <div className="flex animate-in flex-col gap-4 duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none">
                <Controller
                  control={control}
                  name="operatingAddress"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="operatingAddress"
                      label="Address"
                      placeholder="Building number and street"
                      autoComplete="street-address"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="operatingCity"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="operatingCity"
                      label="City"
                      placeholder="e.g. Ikeja"
                      autoComplete="address-level2"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <StateAndLgaFields stateName="operatingState" lgaName="operatingLga" />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Step 2 · Proof of address
 * ---------------------------------------------------------------------------------------------- */

function AddressProofStep({ onEditAddress }: { onEditAddress: () => void }) {
  const { control } = useFormContext<CorporateOnboardingFormData>();
  const values = useWatch({ control });
  const address = values.operatesAtRegisteredAddress
    ? values.company?.registeredAddress
    : [values.operatingAddress, values.operatingCity, values.operatingLga, values.operatingState]
        .filter(Boolean)
        .join(", ");

  return (
    <>
      <StepIntro
        title="Confirm your business address"
        subtitle="Add a recent utility bill showing the address your business operates from."
      />
      <section aria-label="Business address" className="flex flex-col gap-3">
        <SectionLabel>Business address</SectionLabel>
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="min-w-0">
            <p className="text-base font-semibold">{values.company?.companyName}</p>
            <p className="mt-1 text-sm">{address}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {values.operatesAtRegisteredAddress
                ? "Your registered address on the CAC record."
                : "The operating address you entered."}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onEditAddress} className="h-9 shrink-0 rounded-full px-4">
            Edit address
          </Button>
        </div>
      </section>
      <section aria-label="Proof of address" className="flex flex-col gap-3">
        <SectionLabel>Proof of address</SectionLabel>
        <DocumentUpload
          name="addressProof"
          title="Upload a utility bill"
          description="Electricity, water or waste bill for this address, from the last 3 months · JPEG, PNG or PDF up to 10 MB."
          documentLabel="utility bill"
          upload={CORPORATE_DOCUMENT_UPLOAD}
        />
      </section>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Step 3 · Authorisation
 * ---------------------------------------------------------------------------------------------- */

function IdTypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: IdType;
  onChange: (v: IdType) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="ID type" className="flex rounded-full bg-secondary p-0.5">
      {ID_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          disabled={disabled}
          onClick={() => onChange(type)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === type ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {type.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** The person completing this picks themselves from the CAC record and proves it with their NIN or BVN. */
const UNLISTED = "__unlisted__";

function SignatoryIdentity() {
  const { control, setValue, setError, clearErrors } = useFormContext<CorporateOnboardingFormData>();
  const [company, name, unlisted, idType, idNumber, verifiedName] = useWatch({
    control,
    name: [
      "company",
      "signatoryName",
      "signatoryUnlisted",
      "signatoryIdType",
      "signatoryIdNumber",
      "signatoryVerifiedName",
    ],
  });
  const { errors } = useFormState({ control, name: ["signatoryIdNumber", "signatoryVerifiedName"] });
  const verifySignatory = useVerifySignatory();
  const { data: kyc } = useKycState();
  const isVerifying = verifySignatory.isPending;
  const people = company?.people ?? [];
  const typesName = unlisted || people.length === 0;
  const person = typesName
    ? name.trim().length > 1
      ? { fullName: name.trim(), role: "AUTHORISED SIGNATORY" }
      : null
    : people.find((p) => p.fullName === name);
  const idLabel = idType.toUpperCase();
  const idError = errors.signatoryIdNumber?.message ?? errors.signatoryVerifiedName?.message;

  const resetVerification = () => {
    setValue("signatoryVerifiedName", null);
    setValue("signatoryIdNumber", "");
    clearErrors(["signatoryIdNumber", "signatoryVerifiedName"]);
  };

  const verify = () => {
    if (!NIN_PATTERN.test(idNumber.trim())) {
      setError("signatoryIdNumber", { message: `${idLabel} must be 11 digits` }, { shouldFocus: true });
      return;
    }
    clearErrors(["signatoryIdNumber", "signatoryVerifiedName"]);
    verifySignatory.mutate(
      { fullName: name.trim(), idType, idNumber: idNumber.trim() },
      {
        onSuccess: ({ signatory }) =>
          setValue("signatoryVerifiedName", signatory?.verifiedName ?? null, { shouldValidate: true }),
        onError: (error) => setError("signatoryIdNumber", { message: error.message }),
      }
    );
  };

  return (
    <section aria-label="Your identity" className="flex flex-col gap-3">
      <SectionLabel>Your identity</SectionLabel>
      {people.length > 0 && (
        <SelectField
          id="signatoryChoice"
          label="Your name on the CAC record"
          placeholder="Choose your name"
          value={unlisted ? UNLISTED : name}
          items={[
            ...people.map((p) => ({ value: p.fullName, label: `${p.fullName} · ${roleLabel(p.role)}` })),
            { value: UNLISTED, label: "My name isn’t listed" },
          ]}
          contentClassName="light"
          helpText="Not on the list? You’ll need a letter from the company authorising you."
          onChange={(next) => {
            setValue("signatoryUnlisted", next === UNLISTED);
            setValue("signatoryName", next === UNLISTED ? "" : next, { shouldValidate: next !== UNLISTED });
            setValue("authorisationLetter", null);
            resetVerification();
          }}
        />
      )}
      {typesName && (
        <Controller
          control={control}
          name="signatoryName"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="signatoryName"
              label="Your full name"
              placeholder="As it appears on your NIN or BVN"
              autoComplete="name"
              readOnly={!!verifiedName}
              helpText={
                people.length === 0
                  ? "CAC doesn’t list anyone for this company, so we’ll ask for a letter authorising you."
                  : undefined
              }
              error={fieldState.error?.message}
            />
          )}
        />
      )}

      {person && (
        <div
          className={cn(
            "flex animate-in flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none sm:p-5",
            verifiedName && "ring-success/30"
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                verifiedName ? "bg-primary text-primary-foreground" : "bg-secondary text-primary/70"
              )}
            >
              {initials(person.fullName)}
              {verifiedName && (
                <span className="absolute -right-0.5 -bottom-0.5 flex size-4.5 items-center justify-center rounded-full bg-card">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} aria-hidden className="size-4 text-success" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{person.fullName}</p>
              <p className="text-sm text-muted-foreground">{roleLabel(person.role)}</p>
            </div>
          </div>

          {verifiedName ? (
            <div className="flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-success">{idLabel} verified</p>
                <p className="truncate text-xs text-muted-foreground">
                  Name on record · <span className="font-medium tracking-wide text-foreground">{verifiedName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetVerification();
                  requestAnimationFrame(() => document.getElementById("signatoryIdNumber")?.focus());
                }}
                className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="signatoryIdNumber" className="text-sm font-medium">
                  Verify with your
                </label>
                <Controller
                  control={control}
                  name="signatoryIdType"
                  render={({ field }) => (
                    <IdTypeToggle
                      value={field.value}
                      disabled={isVerifying}
                      onChange={(next) => {
                        field.onChange(next);
                        clearErrors("signatoryIdNumber");
                      }}
                    />
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Controller
                  control={control}
                  name="signatoryIdNumber"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="signatoryIdNumber"
                      placeholder={`11-digit ${idLabel}`}
                      inputMode="numeric"
                      maxLength={11}
                      autoComplete="off"
                      className="flex-1"
                      onChange={(v) => field.onChange(v.replace(/\D/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void verify();
                        }
                      }}
                      aria-invalid={!!idError}
                      inputClassName="tracking-widest tabular-nums"
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={verify}
                  disabled={isVerifying || idNumber.length !== 11}
                  className="h-12 shrink-0 rounded-xl bg-card px-5 text-base"
                >
                  {isVerifying ? (
                    <HugeiconsIcon icon={Loading03Icon} aria-hidden className="size-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {idError && (
                <p role="alert" className="text-sm text-destructive">
                  {idError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {verifiedName && kyc?.signatory?.onCacRecord === false && (
        <DocumentUpload
          name="authorisationLetter"
          title="Upload an authorisation letter"
          description={`On company letterhead, signed by a director or proprietor, naming ${name.trim()} to act for ${company?.companyName ?? "the company"} · JPEG, PNG or PDF up to 10 MB.`}
          documentLabel="authorisation letter"
          upload={CORPORATE_DOCUMENT_UPLOAD}
        />
      )}
    </section>
  );
}

function PayoutAccount() {
  const { control, setValue, setError, clearErrors } = useFormContext<CorporateOnboardingFormData>();
  const [company, bankCode, bankName, accountNumber, accountName] = useWatch({
    control,
    name: ["company", "bankCode", "bankName", "accountNumber", "accountName"],
  });
  const savePayout = useSavePayout();
  const isChecking = savePayout.isPending;
  const companyName = company?.companyName ?? "";
  const canRetry = savePayout.isError && !accountName && !!bankCode && accountNumber.length === 10;
  const canClear = !accountName && (!!bankCode || accountNumber.length > 0);

  const clear = () => {
    savePayout.reset();
    setValue("bankName", "");
    setValue("bankCode", undefined);
    setValue("accountNumber", "");
    setValue("accountName", null);
    clearErrors(["bankName", "accountNumber"]);
  };

  const check = (code: string | undefined, name: string, number: string) => {
    setValue("accountName", null);
    if (!code || number.length !== 10) return;
    clearErrors("accountNumber");
    savePayout.mutate(
      { bankCode: code, bankName: name, accountNumber: number },
      {
        onSuccess: ({ payout }) => setValue("accountName", payout?.accountName ?? null, { shouldValidate: true }),
        onError: (error) => setError("accountNumber", { message: error.message }),
      }
    );
  };

  const bank = findBank({ code: bankCode });

  return (
    <section aria-label="Payout account" className="flex flex-col gap-4">
      <SectionLabel>Payout account (optional)</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="bankName"
          render={({ field, fieldState }) => (
            <BankSelectField
              id="bankName"
              value={findBank({ code: bankCode, name: field.value }) ?? null}
              onChange={(next) => {
                setValue("bankCode", next?.code);
                field.onChange(next?.name ?? "");
                field.onBlur();
                check(next?.code, next?.name ?? "", accountNumber);
              }}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="accountNumber"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="accountNumber"
              label="Account number"
              placeholder="10-digit NUBAN"
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
              onChange={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 10);
                field.onChange(digits);
                check(bankCode, bankName, digits);
              }}
              error={fieldState.error?.message}
              inputClassName="tracking-widest tabular-nums"
            />
          )}
        />
      </div>
      <div
        aria-live="polite"
        className={cn(
          "flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors",
          accountName ? "bg-card ring-success/30" : "bg-card/50 ring-foreground/8"
        )}
      >
        {bank ? (
          <BankLogo bank={bank} className="size-9" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <HugeiconsIcon icon={Building06Icon} aria-hidden className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {isChecking ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Loading03Icon} aria-hidden className="size-4 animate-spin" />
              Checking the account name…
            </p>
          ) : accountName ? (
            <>
              <p className="truncate text-sm font-semibold tracking-wide">{accountName}</p>
              <p className="flex items-center gap-1 text-xs text-success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-3.5" />
                Matches your CAC record
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add it now or later from Withdrawals. It must be in the name{" "}
              <span className="font-medium text-foreground">{companyName}</span>.
            </p>
          )}
        </div>
        {!isChecking && (canRetry || canClear) && (
          <div className="flex shrink-0 gap-1">
            {canClear && (
              <Button type="button" variant="ghost" onClick={clear} className="h-9 rounded-full px-3">
                Clear
              </Button>
            )}
            {canRetry && (
              <Button
                type="button"
                variant="outline"
                onClick={() => check(bankCode, bankName, accountNumber)}
                className="h-9 rounded-full bg-card px-4"
              >
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-4 border-b border-border py-3 text-sm last:border-none">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{value}</dd>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function AuthorisationStep({ onEdit }: { onEdit: (step: number) => void }) {
  const { control } = useFormContext<CorporateOnboardingFormData>();
  const values = useWatch({ control });
  const company = values.company;
  const companyType = values.companyType ?? "limited";

  return (
    <>
      <StepIntro title="Authorise this account" subtitle="Confirm who you are, then tell us where payouts go." />

      <SignatoryIdentity />

      <PayoutAccount />

      <section aria-label="Before you submit" className="flex flex-col gap-3">
        <SectionLabel>Before you submit</SectionLabel>
        <div className="rounded-2xl bg-card px-5 py-2 ring-1 ring-foreground/10">
          <dl>
            <ReviewRow
              label="Company"
              onEdit={() => onEdit(0)}
              value={
                <>
                  {company?.companyName}
                  <span className="block text-xs font-normal text-muted-foreground tabular-nums">
                    {companyTypePrefix(companyType)} {company?.registrationNumber} · TIN {company?.tin ?? values.tin}
                  </span>
                </>
              }
            />
            <ReviewRow
              label="Contact"
              onEdit={() => onEdit(0)}
              value={
                <>
                  {values.businessEmail}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {values.businessPhone?.number
                      ? phoneNumberToString({
                          number: values.businessPhone.number,
                          countryCode: values.businessPhone.countryCode ?? "NG",
                        })
                      : ""}
                  </span>
                </>
              }
            />
            <ReviewRow
              label="Address"
              onEdit={() => onEdit(1)}
              value={
                <>
                  {values.addressProof?.name ?? "Utility bill"}
                  <span className="block text-xs font-normal text-muted-foreground">Proof of address</span>
                </>
              }
            />
          </dl>
        </div>
      </section>

      <Controller
        control={control}
        name="confirmed"
        render={({ field, fieldState }) => (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card/50 p-4 text-sm ring-1 ring-foreground/8">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={!!fieldState.error}
              className="mt-0.5 size-5"
            />
            <span>
              I&apos;m authorised to act for {company?.companyName ?? "this company"}, and these details and documents
              are correct.
            </span>
          </label>
        )}
      />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Flow
 * ---------------------------------------------------------------------------------------------- */

export function CorporateOnboarding() {
  const { data: kyc } = useKycState();
  return kyc ? <CorporateFlow kyc={kyc} /> : null;
}

const stepFor = ({ nextStep }: KycState) => {
  if (nextStep === "upload_documents") return 1;
  if (["verify_signatory", "upload_authorisation", "submit"].includes(nextStep)) return LAST_STEP;
  return 0;
};

const formValuesFor = ({ business, signatory, payout }: KycState): CorporateOnboardingFormData => ({
  ...CORPORATE_ONBOARDING_DEFAULT_VALUES,
  ...(business && {
    companyType: business.companyType,
    registrationNumber: business.registrationNumber,
    company: toRecord(business),
    tin: business.tinFromRegistry ? "" : (business.tin ?? ""),
    businessEmail: business.email ?? "",
    businessPhone: { number: business.phone ?? "", countryCode: "NG" },
    operatesAtRegisteredAddress: !business.operatingAddress,
    operatingAddress: business.operatingAddress?.line1 ?? "",
    operatingCity: business.operatingAddress?.city ?? "",
    operatingState: business.operatingAddress?.state ?? "",
    operatingLga: business.operatingAddress?.lga ?? "",
  }),
  ...(signatory && {
    signatoryName: signatory.fullName,
    signatoryUnlisted: !signatory.onCacRecord,
    signatoryIdType: signatory.idType,
    signatoryVerifiedName: signatory.verifiedName,
  }),
  ...(payout && {
    bankName: payout.bankName,
    bankCode: payout.bankCode,
    accountNumber: payout.accountNumber,
    accountName: payout.accountName,
  }),
});

function CorporateFlow({ kyc }: { kyc: KycState }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() => stepFor(kyc));
  const [submitted, setSubmitted] = useState<{ companyName: string; email: string } | null>(null);
  const saveDetails = useSaveBusinessDetails();
  const uploadBill = useUploadUtilityBill();
  const uploadLetter = useUploadAuthorisationLetter();
  const uploadLogo = useUploadCompanyLogo();
  const submitKyc = useSubmitKyc();
  const form = useForm({
    resolver: zodResolver(corporateOnboardingSchema),
    defaultValues: formValuesFor(kyc),
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control });
  const hasProofOfAddress = !!values.addressProof || !!kyc.documents.utilityBill;
  const needsLetter = kyc.signatory?.onCacRecord === false;
  const hasLetter = !!values.authorisationLetter || !!kyc.documents.authorisationLetter;
  const isStepValid =
    STEPS[currentStep].schema.safeParse(values).success &&
    (currentStep !== 1 || hasProofOfAddress) &&
    (currentStep !== LAST_STEP || !needsLetter || hasLetter);
  const isSaving =
    saveDetails.isPending ||
    uploadBill.isPending ||
    uploadLetter.isPending ||
    uploadLogo.isPending ||
    submitKyc.isPending;

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  };

  const save = async () => {
    const data = form.getValues();
    if (currentStep === 0) {
      await saveDetails.mutateAsync({
        tin: data.company?.tin ? undefined : data.tin.trim(),
        email: data.businessEmail.trim(),
        phone: phoneNumberToE164(data.businessPhone),
        operatingAddress: data.operatesAtRegisteredAddress
          ? null
          : {
              line1: data.operatingAddress,
              city: data.operatingCity,
              lga: data.operatingLga,
              state: data.operatingState,
              country: "NG",
            },
      });
      if (data.companyLogo) await uploadLogo.mutateAsync(data.companyLogo);
      return;
    }
    if (currentStep === 1) {
      if (data.addressProof) await uploadBill.mutateAsync(data.addressProof);
      return;
    }
    if (data.authorisationLetter) await uploadLetter.mutateAsync(data.authorisationLetter);
    await submitKyc.mutateAsync();
    setSubmitted({ companyName: data.company?.companyName ?? "your company", email: data.businessEmail });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canContinue = await form.trigger(STEPS[currentStep].fields, { shouldFocus: true });
    if (!canContinue) return;
    try {
      await save();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
      return;
    }
    if (currentStep < LAST_STEP) goToStep(currentStep + 1);
  };

  if (!submitted && (kyc.nextStep === "await_review" || kyc.nextStep === "complete")) {
    return (
      <OnboardingSuccess
        submitted={["Company details", "Proof of address", "Your identity", ...(kyc.payout ? ["Payout account"] : [])]}
        message="We’re reviewing your business now. We’ll email you as soon as you’re approved."
      />
    );
  }

  if (submitted) {
    return (
      <OnboardingSuccess
        submitted={["Company details", "Proof of address", "Your identity", ...(kyc.payout ? ["Payout account"] : [])]}
        message={
          <>
            We&apos;re reviewing <span className="font-medium text-foreground">{submitted.companyName}</span>. Business
            checks take a little longer than personal ones, so we&apos;ll email{" "}
            <span className="font-medium text-foreground">{submitted.email}</span> as soon as you&apos;re approved.
          </>
        }
      />
    );
  }

  return (
    <div className="light grid min-h-dvh flex-1 bg-background text-foreground scheme-light lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
      <StepRail
        steps={STEPS}
        current={currentStep}
        eyebrow="Business verification"
        heading={
          <>
            Three steps to verify
            <br />
            your business
          </>
        }
        footnote="Company documents are encrypted and only used to verify your business."
      />
      <main className="flex min-w-0 flex-col">
        <TopBar
          steps={STEPS}
          current={currentStep}
          title="Business verification"
          onBack={() => (currentStep === 0 ? router.push("/dashboard") : goToStep(currentStep - 1))}
        />
        <FormProvider {...form}>
          <form
            method="post"
            noValidate
            onSubmit={handleSubmit}
            className={cn("flex flex-1 flex-col", CORPORATE_FIELD_STYLES)}
          >
            <div
              key={currentStep}
              className="mx-auto flex w-full max-w-[600px] flex-1 animate-in flex-col gap-8 px-5 pt-4 pb-10 duration-300 fade-in slide-in-from-right-2 motion-reduce:animate-none"
            >
              {kyc.rejectionReason && (
                <p
                  role="alert"
                  className="rounded-2xl bg-destructive/8 p-4 text-sm text-destructive ring-1 ring-destructive/20"
                >
                  {kyc.rejectionReason}
                </p>
              )}
              {currentStep === 0 && <CompanyStep />}
              {currentStep === 1 && <AddressProofStep onEditAddress={() => goToStep(0)} />}
              {currentStep === LAST_STEP && <AuthorisationStep onEdit={goToStep} />}
            </div>
            <div className="sticky bottom-0 bg-linear-to-t from-background via-background to-background/0 pt-6">
              <div className="mx-auto w-full max-w-[600px] px-5 pb-6">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={!isStepValid}
                  className="h-13 w-full rounded-xl text-base"
                >
                  {currentStep === LAST_STEP ? "Submit for review" : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
}
