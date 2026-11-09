"use client";
import * as React from "react";

import { naira } from "@/app/dashboard/(dashboard)/marketplace/page";
import { AppModal } from "@/components/primitives/app-modal";
import { DateField } from "@/components/primitives/date-field";
import { NumberField } from "@/components/primitives/number-field";
import { SelectField } from "@/components/primitives/select-field";
import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminInvestment,
  type AdminInvestmentForm,
  adminInvestmentFormSchema,
  publishAdminInvestmentSchema,
} from "@/constant/schemas/admin-investments";
import type { MediaAsset } from "@/constant/schemas/admin-media";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { STAFF } from "../../_operations/data";
import { Notice, PageLink, PageTitle, Panel, StatusBadge } from "../../_operations/ui";
import { IMAGE_TYPES, MediaSlot, openMediaPicker } from "../../media/_library";
import { BASIS_ITEMS, FREQUENCY_ITEMS, IMAGE_ITEMS, TYPE_ITEMS, maturityDate } from "../_data";
import { useAdminInvestments } from "../_store";

// Sample library files that are one of the built-in property illustrations.
const PRESET_BY_ASSET: Record<string, AdminInvestmentForm["image"]> = {
  "MD-01": "golden-estate",
  "MD-04": "waterfront",
  "MD-05": "skyline",
  "MD-06": "residences",
  "MD-07": "city-lights",
};

const DEFAULTS: AdminInvestmentForm = {
  name: "",
  location: "",
  city: "",
  type: "residential",
  developer: "",
  completionDate: "",
  image: "golden-estate",
  description: "",
  highlights: [],
  targetRoi: 14,
  tenureMonths: 12,
  payoutFrequency: "quarterly",
  accrualBasis: "30/360",
  unitPrice: 150000,
  totalUnits: 1000,
  minUnits: 1,
  maxUnits: 50,
  startDate: "",
  endDate: "",
  publisherId: "staff-nneka",
  rightsConfirmed: false,
  termsConfirmed: false,
};
export function InvestmentEditor({ id }: { id?: string }) {
  const { ready, investments } = useAdminInvestments();
  if (!ready) return <Skeleton className="h-96 rounded-2xl" />;
  const investment = id ? investments.find((i) => i.id === id) : undefined;
  if (id && !investment)
    return (
      <PageTitle title="Investment not found" description="Select an existing offering to edit.">
        <PageLink href="/admin/investments">All investments</PageLink>
      </PageTitle>
    );
  return <EditorForm key={id ?? "new"} investment={investment} />;
}
function EditorForm({ investment }: { investment?: AdminInvestment }) {
  const router = useRouter();
  const { save } = useAdminInvestments();
  const form = useForm<AdminInvestmentForm>({
    resolver: zodResolver(adminInvestmentFormSchema),
    defaultValues: investment
      ? { ...adminInvestmentFormSchema.parse(investment), rightsConfirmed: false, termsConfirmed: false }
      : DEFAULTS,
  });
  const values = useWatch({ control: form.control });
  const [uploadName, setUploadName] = React.useState("");
  const [coverAsset, setCoverAsset] = React.useState<MediaAsset | null>(null);
  const [saved, setSaved] = React.useState(false);
  // Library illustrations map back to their preset; other images use the library's saved preview.
  const applyLibraryCover = (asset: MediaAsset) => {
    const preset = PRESET_BY_ASSET[asset.id];
    if (preset) {
      form.setValue("image", preset, { shouldDirty: true });
      form.setValue("coverPreview", undefined, { shouldDirty: true, shouldValidate: true });
      setUploadName("");
      return;
    }
    if (!asset.preview) {
      form.setError("coverPreview", { message: "This image has no preview yet. Upload it again in the library." });
      return;
    }
    form.setValue("coverPreview", asset.preview, { shouldDirty: true, shouldValidate: true });
    setUploadName(asset.name);
    setCoverAsset(asset);
  };
  const allocated = investment?.unitsSold ?? 0;
  const persist = (data: AdminInvestmentForm, publicationStatus: "draft" | "pending-review") => {
    const next: AdminInvestment = {
      ...data,
      id: investment?.id ?? crypto.randomUUID(),
      unitsSold: allocated,
      // New offerings open once approved; the server owns the funding status after that.
      status: investment?.status ?? "fundingSoon",
      referralPlan: investment?.referralPlan ?? null,
      documents: investment?.documents,
      publicationStatus,
      version: (investment?.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    if (save(next)) {
      setSaved(true);
      form.reset(data);
      toast.success(
        publicationStatus === "draft"
          ? "Investment draft saved locally"
          : "Publication review saved locally; no live changes applied"
      );
      router.push(`/admin/investments/${next.id}`);
    }
  };
  function validateAllocation(data: AdminInvestmentForm) {
    if (data.totalUnits < allocated) {
      form.setError("totalUnits", { message: `At least ${allocated.toLocaleString()} units are already allocated` });
      return false;
    }
    if (!STAFF.some((s) => s.id === data.publisherId && s.access === "active")) {
      form.setError("publisherId", { message: "Choose an active publisher" });
      return false;
    }
    return true;
  }
  const review = (data: AdminInvestmentForm) => {
    if (!validateAllocation(data)) return;
    const parsed = publishAdminInvestmentSchema.safeParse(data);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof AdminInvestmentForm, { message: issue.message })
      );
      return;
    }
    AppModal.open({
      title: "Review publication changes",
      description: investment ? `${investment.name} · version ${investment.version}` : "New investment offering",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold">{data.name}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt>Location</dt>
            <dd>
              {data.location}, {data.city}
            </dd>
            <dt>Developer</dt>
            <dd>{data.developer}</dd>
            <dt>Unit price</dt>
            <dd>{naira(data.unitPrice)}</dd>
            <dt>Target annual ROI</dt>
            <dd>{data.targetRoi}% · not guaranteed</dd>
            <dt>Tenure</dt>
            <dd>{data.tenureMonths} months</dd>
            <dt>Offering</dt>
            <dd>{data.totalUnits.toLocaleString()} units</dd>
            <dt>Publisher</dt>
            <dd>{STAFF.find((s) => s.id === data.publisherId)?.name}</dd>
          </dl>
          <Notice>
            This saves a browser-local publication review. It does not publish to the investor marketplace. The backend
            must validate the offering and obtain an independent approval.
          </Notice>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => AppModal.close()}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              persist(data, "pending-review");
              AppModal.close();
            }}
          >
            Submit for review
          </Button>
        </div>
      ),
    });
  };
  const imageSrc = values.coverPreview ?? `/assets/images/marketplace/${values.image ?? "golden-estate"}.png`;
  return (
    <>
      <PageTitle
        title={investment ? "Edit Investment" : "Add New Investment"}
        description={
          investment ? `${investment.name} · local changes only` : "Prepare a new offering for publication review."
        }
      >
        <PageLink href={investment ? `/admin/investments/${investment.id}` : "/admin/investments"}>Cancel</PageLink>
      </PageTitle>
      <form noValidate onSubmit={form.handleSubmit(review)} className="space-y-5">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-5">
            <Panel title="Investment details" description="The information investors will see in the marketplace">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="offering-name"
                      label="Investment Name"
                      placeholder="e.g. Golden Estate"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <SelectField
                      {...field}
                      id="offering-type"
                      label="Property type"
                      items={TYPE_ITEMS}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="location"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="offering-location"
                      label="Neighbourhood"
                      placeholder="e.g. Lekki Phase 1"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="city"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="offering-city"
                      label="City"
                      placeholder="e.g. Lagos"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="developer"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="offering-developer"
                      label="Developer"
                      placeholder="e.g. Landmark Homes Ltd"
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="completionDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <DateField
                      {...field}
                      id="offering-completion"
                      label="Completion date"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div className="relative aspect-16/9 overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={imageSrc}
                  alt="Investment cover preview"
                  fill
                  sizes="(min-width:1280px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
              <Controller
                name="image"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    id="offering-cover"
                    onChange={(value) => {
                      field.onChange(value);
                      form.setValue("coverPreview", undefined, { shouldDirty: true, shouldValidate: true });
                      setUploadName("");
                    }}
                    label="Cover illustration"
                    items={IMAGE_ITEMS}
                    helpText="Use an existing property illustration or upload your own cover."
                    error={fieldState.error?.message}
                  />
                )}
              />
              <MediaSlot
                label="Custom cover"
                hint="Pick a photo from the media library or upload one there"
                asset={values.coverPreview ? coverAsset : null}
                name={values.coverPreview ? uploadName || "Custom cover" : undefined}
                onPick={() =>
                  openMediaPicker({
                    title: "Choose a cover",
                    accept: IMAGE_TYPES,
                    onSelect: ([asset]) => applyLibraryCover(asset),
                  })
                }
                error={form.formState.errors.coverPreview?.message}
              />
              {values.coverPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-fit rounded-full"
                  onClick={() => {
                    form.setValue("coverPreview", undefined, { shouldDirty: true, shouldValidate: true });
                    setUploadName("");
                  }}
                >
                  Use the illustration instead
                </Button>
              )}
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    {...field}
                    id="offering-description"
                    label="Investment Description"
                    placeholder="Describe the development, allocation purpose and reporting milestones."
                    textareaClassName="min-h-44"
                    maxLength={5000}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="highlights"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    id="offering-highlights"
                    label="Highlights"
                    helpText="One per line, up to six. Investors see these on the property page."
                    placeholder={"Verified C of O and approved building plan\nQuarterly construction updates"}
                    value={field.value.join("\n")}
                    onChange={(text) => field.onChange(text.split("\n").slice(0, 6))}
                    onBlur={() => field.onChange(field.value.map((line) => line.trim()).filter(Boolean))}
                    textareaClassName="min-h-28"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </Panel>
            <Panel title="Cover rights & offering review">
              <Controller
                name="rightsConfirmed"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />I confirm the cover image is
                      approved for this offering.
                    </label>
                    {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="termsConfirmed"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />I reviewed the offering terms,
                      figures and risk disclosures.
                    </label>
                    {fieldState.error && <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Notice>Drafts can be saved before these checks. Publication review requires both confirmations.</Notice>
            </Panel>
          </div>
          <aside className="space-y-5">
            <Panel title="Offering terms" description="Target returns are illustrative projections">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {(
                  [
                    { name: "targetRoi", label: "Target annual ROI (%)", decimal: true },
                    { name: "unitPrice", label: "Unit Price", decimal: true },
                    { name: "totalUnits", label: "Total Units", decimal: false },
                    { name: "minUnits", label: "Minimum units per investor", decimal: false },
                    { name: "maxUnits", label: "Maximum units per investor", decimal: false },
                  ] as const
                ).map(({ name, label, decimal }) => (
                  <Controller
                    key={name}
                    name={name}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <NumberField
                        {...field}
                        id={`offering-${name}`}
                        label={label}
                        allowDecimal={decimal}
                        prefix={name === "unitPrice" ? "₦" : undefined}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {allocated.toLocaleString()} units already allocated. Allocations cannot be edited here.
              </p>
              <Controller
                name="tenureMonths"
                control={form.control}
                render={({ field, fieldState }) => (
                  <NumberField
                    {...field}
                    id="offering-tenure"
                    label="Duration (months)"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <Controller
                  name="payoutFrequency"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <SelectField
                      {...field}
                      id="offering-frequency"
                      label="Return payout"
                      items={FREQUENCY_ITEMS}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="accrualBasis"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <SelectField
                      {...field}
                      id="offering-basis"
                      label="Interest calculation"
                      items={BASIS_ITEMS}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <DateField {...field} id="offering-start" label="Start Date" error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="endDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <DateField {...field} id="offering-end" label="End Date" error={fieldState.error?.message} />
                  )}
                />
              </div>
              <Notice>
                Minimum investment: {naira((values.minUnits ?? 0) * (values.unitPrice ?? 0))}. Total offering:{" "}
                {naira((values.totalUnits ?? 0) * (values.unitPrice ?? 0))}. Returns of {values.targetRoi ?? 0}% a year
                are paid {FREQUENCY_ITEMS.find((item) => item.value === values.payoutFrequency)?.label.toLowerCase()}
                {values.startDate && values.tenureMonths
                  ? `, and principal is released at maturity on ${maturityDate({ startDate: values.startDate, tenureMonths: Number(values.tenureMonths) })}`
                  : ""}
                .
              </Notice>
            </Panel>
            <Panel title="Admin Publisher">
              <Controller
                name="publisherId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    id="offering-publisher"
                    label="Publisher"
                    items={STAFF.filter(
                      (s) => s.access === "active" && (s.role === "super-admin" || s.role === "property-manager")
                    ).map((s) => ({ value: s.id, label: s.name }))}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Notice>
                Publisher selection records the intended owner. Publishing permissions and approval are checked by the
                server.
              </Notice>
            </Panel>
            <Panel title="Publication" description="Save your work or request a review">
              <StatusBadge value={investment?.publicationStatus ?? "draft"} />
              <Button className="w-full" type="submit" disabled={saved}>
                Review publication changes
              </Button>
              <Button
                className="w-full"
                variant="outline"
                type="button"
                disabled={saved}
                onClick={form.handleSubmit((data) => {
                  if (validateAllocation(data)) persist(data, "draft");
                })}
              >
                Save as Draft
              </Button>
              <Notice>
                Saving an edit as a draft only updates this browser’s preview. The live offering and investor
                allocations remain unchanged.
              </Notice>
            </Panel>
          </aside>
        </div>
      </form>
    </>
  );
}

export default function Page() {
  return <InvestmentEditor />;
}
