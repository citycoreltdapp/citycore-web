import { PROPERTIES, type Property } from "@/app/dashboard/(dashboard)/marketplace/page";
import type { AdminInvestment } from "@/constant/schemas/admin-investments";

const PRESET_BY_IMAGE: Record<string, AdminInvestment["image"]> = {
  "/assets/images/marketplace/golden-estate.png": "golden-estate",
  "/assets/images/marketplace/residences.png": "residences",
  "/assets/images/marketplace/waterfront.png": "waterfront",
  "/assets/images/marketplace/skyline.png": "skyline",
  "/assets/images/marketplace/city-lights.png": "city-lights",
};

export const ADMIN_INVESTMENTS: AdminInvestment[] = PROPERTIES.map((property) => ({
  id: property.id,
  name: property.name,
  location: property.location,
  city: property.city,
  type: property.type,
  developer: property.developer,
  completionDate: property.completionDate,
  image: PRESET_BY_IMAGE[property.images[0]] ?? "golden-estate",
  description: property.description,
  highlights: property.highlights,
  targetRoi: property.targetRoi,
  tenureMonths: property.tenureMonths,
  unitPrice: property.unitPrice,
  totalUnits: property.totalUnits,
  minUnits: property.minUnits,
  maxUnits: property.maxUnits,
  unitsSold: property.unitsSold,
  status: property.status,
  startDate: "2026-11-01",
  endDate: property.tenureMonths === 12 ? "2027-11-01" : "2028-05-01",
  publisherId: "staff-nneka",
  rightsConfirmed: true,
  termsConfirmed: true,
  publicationStatus: "active",
  version: 1,
  updatedAt: "2026-11-07T08:00:00Z",
}));

/** The investor-facing offering this record publishes, for the shared marketplace components. */
export const toProperty = (record: AdminInvestment): Property => ({
  id: record.id,
  name: record.name,
  location: record.location,
  city: record.city,
  type: record.type,
  status: record.status,
  images: [record.coverPreview ?? `/assets/images/marketplace/${record.image}.png`],
  unitPrice: record.unitPrice,
  targetRoi: record.targetRoi,
  tenureMonths: record.tenureMonths,
  totalUnits: record.totalUnits,
  unitsSold: record.unitsSold,
  minUnits: record.minUnits,
  maxUnits: record.maxUnits,
  developer: record.developer,
  completionDate: record.completionDate,
  description: record.description,
  highlights: record.highlights,
});

export const TYPE_ITEMS = [
  { value: "residential", label: "Residential development" },
  { value: "commercial", label: "Commercial property" },
  { value: "mixedUse", label: "Mixed-use development" },
];
export const IMAGE_ITEMS = [
  { value: "golden-estate", label: "Golden Estate" },
  { value: "residences", label: "City Residences" },
  { value: "waterfront", label: "Waterfront" },
  { value: "skyline", label: "Skyline" },
  { value: "city-lights", label: "City Lights" },
];
