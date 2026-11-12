"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import { BankLogo, BankSelectField, findBank } from "@/components/primitives/bank-select-field";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  COMPANY_TYPES,
  CORPORATE_DOCUMENT_UPLOAD,
  CORPORATE_ONBOARDING_DEFAULT_VALUES,
  CORPORATE_ONBOARDING_STEPS,
  type CacRecord,
  type CompanyType,
  type CorporateOnboardingFormData,
  ID_TYPES,
  type IdType,
  type PersonRole,
  REGISTRATION_NUMBER_PATTERN,
  companyTypePrefix,
  corporateOnboardingSchema,
} from "@/constant/corporate-onboarding";
import { NIN_PATTERN } from "@/constant/onboarding";
import { phoneNumberToString } from "@/lib/phone-number";
import { setKycStatus } from "@/lib/verification-status";
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
import { Controller, FormProvider, useForm, useFormContext, useFormState, useWatch } from "react-hook-form";

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

/** What each kind of company calls the people on its CAC record. */
const COMPANY_COPY: Record<
  CompanyType,
  {
    roles: { value: PersonRole; label: string }[];
  }
> = {
  limited: {
    roles: [
      { value: "director", label: "Director" },
      { value: "shareholder", label: "Shareholder" },
      { value: "both", label: "Director & shareholder" },
    ],
  },
  businessName: {
    roles: [{ value: "both", label: "Proprietor" }],
  },
  trustees: {
    roles: [{ value: "director", label: "Trustee" }],
  },
  limitedPartnership: {
    roles: [{ value: "both", label: "Partner" }],
  },
  llp: {
    roles: [{ value: "both", label: "Partner" }],
  },
};

const roleLabel = (type: CompanyType, role: PersonRole) =>
  COMPANY_COPY[type].roles.find((option) => option.value === role)?.label ?? "Director";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

/** "Harbourline Properties Ltd." and "HARBOURLINE PROPERTIES LIMITED" are the same name to a bank. */
const sameCompanyName = (a: string, b: string) => {
  const normalise = (name: string) =>
    name
      .toUpperCase()
      .replace(/\bLTD\b\.?/g, "LIMITED")
      .replace(/[^A-Z0-9]/g, "");
  return normalise(a) === normalise(b);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Words of a person's name, so "Okafor, Adaeze N." and "ADAEZE NGOZI OKAFOR" can be compared. */
const nameWords = (name: string) =>
  name
    .toUpperCase()
    .replace(/[^A-Z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word.length > 1);

/** Every name on the CAC record has to appear on the ID; the ID may add a middle name. */
const samePerson = (cacName: string, idName: string) => {
  const onId = new Set(nameWords(idName));
  const onCac = nameWords(cacName);
  return onCac.length > 0 && onCac.every((word) => onId.has(word));
};

/* Dojah's response shapes, cut down to what the flow reads. */
interface DojahCac {
  company_name: string;
  rc_number: string;
  status: string;
  date_of_registration: string;
  address: string;
  affiliates: { first_name: string; last_name: string; affiliate_type: string }[];
}
interface DojahTin {
  tax_id: string | null;
}
interface DojahIdentity {
  first_name: string;
  middle_name?: string;
  last_name: string;
}
interface DojahAccount {
  account_name: string;
}

/** CAC lists a director who also holds shares twice, once per role; the form wants one person with both. */
function toPeople(affiliates: DojahCac["affiliates"]): CacRecord["people"] {
  const people = new Map<string, CacRecord["people"][number]>();
  for (const affiliate of affiliates) {
    const fullName = `${affiliate.first_name} ${affiliate.last_name}`.trim();
    const type = affiliate.affiliate_type.toUpperCase();
    const role: PersonRole = type.includes("SHAREHOLDER")
      ? "shareholder"
      : type.includes("PROPRIETOR") || type.includes("PARTNER")
        ? "both"
        : "director";
    const key = nameWords(fullName).toSorted().join(" ");
    const existing = people.get(key);
    people.set(key, { fullName, role: existing && existing.role !== role ? "both" : role });
  }
  return [...people.values()];
}

const toIsoDate = (value: string) => new Date(value).toISOString().slice(0, 10);

// ponytail: these stand in for Dojah, returning its response shapes so wiring it up only swaps the fetch:
//   CAC     GET /api/v1/kyc/cac/advance?rc_number=&company_type=   (company_type from COMPANY_TYPES.dojahType)
//   TIN     GET /api/v1/kyc/cac/tin?rc_number=&company_type=
//   NIN     GET /api/v1/kyc/nin?nin=            BVN  GET /api/v1/kyc/bvn/full?bvn=
//   Account GET /api/v1/general/account?account_number=&bank_code=
// Call them from the server: Dojah's secret key can't ship to the browser.
// Demo numbers: all zeros finds nothing, all ones gives a mismatch, and business names have no TIN on file.
const DEMO_AFFILIATES: Record<CompanyType, DojahCac["affiliates"]> = {
  limited: [
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "DIRECTOR" },
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "SHAREHOLDER" },
    { first_name: "Tunde", last_name: "Bakare", affiliate_type: "DIRECTOR" },
    { first_name: "Ifeoma", last_name: "Nwosu", affiliate_type: "SHAREHOLDER" },
  ],
  businessName: [
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "PROPRIETOR" },
    { first_name: "Tunde", last_name: "Bakare", affiliate_type: "PROPRIETOR" },
  ],
  trustees: [
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "TRUSTEE" },
    { first_name: "Tunde", last_name: "Bakare", affiliate_type: "TRUSTEE" },
    { first_name: "Ifeoma", last_name: "Nwosu", affiliate_type: "TRUSTEE" },
  ],
  limitedPartnership: [
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "GENERAL PARTNER" },
    { first_name: "Tunde", last_name: "Bakare", affiliate_type: "LIMITED PARTNER" },
  ],
  llp: [
    { first_name: "Adaeze", last_name: "Okafor", affiliate_type: "DESIGNATED PARTNER" },
    { first_name: "Tunde", last_name: "Bakare", affiliate_type: "PARTNER" },
  ],
};

const DEMO_NAMES: Record<CompanyType, string> = {
  limited: "Harbourline Properties Limited",
  businessName: "Harbourline Ventures",
  trustees: "Harbourline Community Foundation",
  limitedPartnership: "Harbourline Capital LP",
  llp: "Harbourline Advisory LLP",
};

async function fetchDojahCac(companyType: CompanyType, rcNumber: string): Promise<DojahCac | null> {
  await wait(800);
  if (/^0+$/.test(rcNumber)) return null;
  return {
    company_name: DEMO_NAMES[companyType].toUpperCase(),
    rc_number: rcNumber,
    status: /^1+$/.test(rcNumber) ? "INACTIVE" : "ACTIVE",
    date_of_registration: "2019-03-12T00:00:00.000Z",
    address: "14 Adeola Odeku Street, Victoria Island, Lagos",
    affiliates: DEMO_AFFILIATES[companyType],
  };
}

async function fetchDojahTin(companyType: CompanyType): Promise<DojahTin> {
  await wait(300);
  return { tax_id: companyType === "businessName" ? null : "23456789-0001" };
}

async function fetchDojahIdentity(idNumber: string, fullName: string): Promise<DojahIdentity | null> {
  await wait(700);
  if (/^0+$/.test(idNumber)) return null;
  if (/^1+$/.test(idNumber)) return { first_name: "CHIOMA", last_name: "EZE" };
  const [first = "", ...rest] = fullName.toUpperCase().split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") };
}

async function fetchDojahAccount(accountNumber: string, companyName: string): Promise<DojahAccount> {
  await wait(700);
  return { account_name: /^0+$/.test(accountNumber) ? "ADAEZE OKAFOR" : companyName.toUpperCase() };
}

/** Title case for names CAC returns in capitals, keeping words like "LLP" as they are. */
const titleCase = (name: string) =>
  name.replace(/\b([A-Z])([A-Z]+)\b/g, (word, first: string, rest: string) =>
    ["LP", "LLP", "PLC", "NGO"].includes(word) ? word : first + rest.toLowerCase()
  );

async function lookupCompany(companyType: CompanyType, registrationNumber: string): Promise<CacRecord> {
  const cac = await fetchDojahCac(companyType, registrationNumber);
  if (!cac) throw new Error("No company found with that number and type. Check your certificate and try again.");
  if (cac.status.toUpperCase() !== "ACTIVE") {
    throw new Error("This company isn’t active on the CAC register, so it can’t be verified yet.");
  }
  const { tax_id } = await fetchDojahTin(companyType);
  return {
    registrationNumber,
    companyType,
    companyName: titleCase(cac.company_name),
    registeredOn: toIsoDate(cac.date_of_registration),
    registeredAddress: cac.address,
    tin: tax_id,
    people: toPeople(cac.affiliates).map((person) => ({ ...person, fullName: titleCase(person.fullName) })),
  };
}

/** The name on the NIN or BVN record, once it matches the person's name. */
async function verifyPersonId(idType: IdType, idNumber: string, fullName: string) {
  const label = idType.toUpperCase();
  const identity = await fetchDojahIdentity(idNumber, fullName);
  if (!identity) throw new Error(`No record found for this ${label}. Check the number and try again.`);
  const nameOnId = [identity.first_name, identity.middle_name, identity.last_name].filter(Boolean).join(" ");
  if (!samePerson(fullName, nameOnId)) {
    throw new Error(`This ${label} belongs to ${nameOnId.toUpperCase()}, not ${fullName}.`);
  }
  return nameOnId.toUpperCase();
}

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
    ["Registered", formatDate(record.registeredOn)],
    ["Registered address", record.registeredAddress],
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

function CompanyStep() {
  const { control, setValue, setError, clearErrors, getFieldState, formState } =
    useFormContext<CorporateOnboardingFormData>();
  const [companyType, registrationNumber, company, operatesAtRegisteredAddress] = useWatch({
    control,
    name: ["companyType", "registrationNumber", "company", "operatesAtRegisteredAddress"],
  });
  const [isLooking, setIsLooking] = useState(false);
  const prefix = companyTypePrefix(companyType);

  const findCompany = async () => {
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
    setIsLooking(true);
    try {
      const record = await lookupCompany(companyType, number);
      setValue("company", record, { shouldValidate: true });
      setValue("signatoryName", "");
      setValue("signatoryIdNumber", "");
      setValue("signatoryVerifiedName", null);
      setValue("tin", "");
    } catch (error) {
      setError("registrationNumber", {
        message: error instanceof Error ? error.message : "We couldn't find that company.",
      });
    } finally {
      setIsLooking(false);
    }
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
              isLoading={isLooking}
              disabled={registrationNumber.length < 4}
              className="h-12 rounded-xl text-base"
            >
              {!isLooking && <HugeiconsIcon icon={Search01Icon} aria-hidden data-icon="inline-start" />}
              Find my company
            </Button>
          )}
        </div>
      </div>

      {company && (
        <>
          <CacRecordCard record={company} />

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
function SignatoryIdentity() {
  const { control, setValue, setError, clearErrors } = useFormContext<CorporateOnboardingFormData>();
  const [company, name, idType, idNumber, verifiedName] = useWatch({
    control,
    name: ["company", "signatoryName", "signatoryIdType", "signatoryIdNumber", "signatoryVerifiedName"],
  });
  const { errors } = useFormState({ control, name: ["signatoryIdNumber", "signatoryVerifiedName"] });
  const [isVerifying, setIsVerifying] = useState(false);
  const companyType = company?.companyType ?? "limited";
  const people = company?.people ?? [];
  const person = people.find((p) => p.fullName === name);
  const idLabel = idType.toUpperCase();
  const idError = errors.signatoryIdNumber?.message ?? errors.signatoryVerifiedName?.message;

  const resetVerification = () => {
    setValue("signatoryVerifiedName", null);
    setValue("signatoryIdNumber", "");
    clearErrors(["signatoryIdNumber", "signatoryVerifiedName"]);
  };

  const verify = async () => {
    if (!NIN_PATTERN.test(idNumber.trim())) {
      setError("signatoryIdNumber", { message: `${idLabel} must be 11 digits` }, { shouldFocus: true });
      return;
    }
    clearErrors(["signatoryIdNumber", "signatoryVerifiedName"]);
    setIsVerifying(true);
    try {
      const nameOnId = await verifyPersonId(idType, idNumber.trim(), name);
      setValue("signatoryVerifiedName", nameOnId, { shouldValidate: true });
    } catch (error) {
      setError("signatoryIdNumber", {
        message: error instanceof Error ? error.message : `We couldn't check that ${idLabel}.`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section aria-label="Your identity" className="flex flex-col gap-3">
      <SectionLabel>Your identity</SectionLabel>
      <Controller
        control={control}
        name="signatoryName"
        render={({ field, fieldState }) => (
          <SelectField
            {...field}
            id="signatoryName"
            label="Your name on the CAC record"
            placeholder="Choose your name"
            items={people.map((p) => ({
              value: p.fullName,
              label: `${p.fullName} · ${roleLabel(companyType, p.role)}`,
            }))}
            contentClassName="light"
            helpText="Only people listed on the company’s CAC record can complete this."
            onChange={(next) => {
              field.onChange(next);
              resetVerification();
            }}
            error={fieldState.error?.message}
          />
        )}
      />

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
              <p className="text-sm text-muted-foreground">{roleLabel(companyType, person.role)}</p>
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
    </section>
  );
}

function PayoutAccount() {
  const { control, setValue, setError, clearErrors } = useFormContext<CorporateOnboardingFormData>();
  const [company, bankCode, accountNumber, accountName] = useWatch({
    control,
    name: ["company", "bankCode", "accountNumber", "accountName"],
  });
  const [isChecking, setIsChecking] = useState(false);
  const companyName = company?.companyName ?? "";

  const check = async (code: string | undefined, number: string) => {
    setValue("accountName", null);
    if (!code || number.length !== 10) return;
    clearErrors("accountNumber");
    setIsChecking(true);
    try {
      const { account_name: name } = await fetchDojahAccount(number, companyName);
      if (sameCompanyName(name, companyName)) {
        setValue("accountName", name, { shouldValidate: true });
      } else {
        setError("accountNumber", {
          message: `This account belongs to ${name}. Payouts can only go to an account in the company’s name.`,
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const bank = findBank({ code: bankCode });

  return (
    <section aria-label="Payout account" className="flex flex-col gap-4">
      <SectionLabel>Payout account</SectionLabel>
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
                void check(next?.code, accountNumber);
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
                void check(bankCode, digits);
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
              Must be a corporate account in the name <span className="font-medium text-foreground">{companyName}</span>
              .
            </p>
          )}
        </div>
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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState<{ companyName: string; email: string } | null>(null);
  const form = useForm({
    resolver: zodResolver(corporateOnboardingSchema),
    defaultValues: CORPORATE_ONBOARDING_DEFAULT_VALUES,
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control });
  const isStepValid = STEPS[currentStep].schema.safeParse(values).success;

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0 });
  };

  const submit = form.handleSubmit((data) => {
    // ponytail: no KYB endpoint yet; post this as multipart once it exists.
    console.log("KYB onboarding submitted", data);
    setSubmitted({
      companyName: data.company?.companyName ?? "your company",
      email: data.businessEmail,
    });
    form.reset();
    setKycStatus("pending");
    goToStep(0);
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStep === LAST_STEP) return submit(event);
    const canContinue = await form.trigger(STEPS[currentStep].fields, { shouldFocus: true });
    if (canContinue) goToStep(currentStep + 1);
  };

  if (submitted) {
    return (
      <OnboardingSuccess
        submitted={["Company details", "Proof of address", "Your identity", "Payout account"]}
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
              {currentStep === 0 && <CompanyStep />}
              {currentStep === 1 && <AddressProofStep onEditAddress={() => goToStep(0)} />}
              {currentStep === LAST_STEP && <AuthorisationStep onEdit={goToStep} />}
            </div>
            <div className="sticky bottom-0 bg-linear-to-t from-background via-background to-background/0 pt-6">
              <div className="mx-auto w-full max-w-[600px] px-5 pb-6">
                <Button
                  type="submit"
                  isLoading={form.formState.isSubmitting}
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
