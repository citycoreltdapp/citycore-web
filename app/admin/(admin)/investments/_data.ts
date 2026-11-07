import { INVESTMENTS } from "@/app/dashboard/(dashboard)/marketplace/_data";
import type { AdminInvestment } from "@/constant/schemas/admin-investments";

export const ADMIN_INVESTMENTS: AdminInvestment[] = INVESTMENTS.map((investment) => ({
  ...investment,
  image: investment.image as AdminInvestment["image"],
  category: "residential",
  description:
    "Allocation funds acquisition and staged development of residential units. City Core provides quarterly progress updates and reporting against the offering milestones.",
  minimumUnits: 1,
  startDate: "2026-11-01",
  endDate: investment.tenure === 12 ? "2027-11-01" : "2028-05-01",
  publisherId: "staff-nneka",
  rightsConfirmed: true,
  termsConfirmed: true,
  status: "active",
  version: 1,
  updatedAt: "2026-11-07T08:00:00Z",
}));
export const CATEGORY_ITEMS = [
  { value: "residential", label: "Residential development" },
  { value: "commercial", label: "Commercial property" },
  { value: "mixed-use", label: "Mixed-use development" },
];
export const IMAGE_ITEMS = [
  { value: "golden-estate", label: "Golden Estate" },
  { value: "residences", label: "City Residences" },
  { value: "waterfront", label: "Waterfront" },
  { value: "skyline", label: "Skyline" },
  { value: "city-lights", label: "City Lights" },
];
