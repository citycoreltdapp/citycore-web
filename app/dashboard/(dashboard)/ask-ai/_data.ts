import type { Preferences, RecommendationRecord } from "@/constant/schemas/insights";

import { HOLDINGS } from "../investments/_data";
import { PROPERTIES, canInvest } from "../marketplace/page";

export type { Preferences, RecommendationRecord } from "@/constant/schemas/insights";

export const DEFAULT_PREFERENCES: Preferences = {
  budget: "500000",
  horizon: "12",
  risk: "balanced",
  location: "all",
  portfolio: true,
};
// Demo matching rules only; replace with the recommendation service when available.
export function matchInvestments(preferences: Preferences) {
  return PROPERTIES.filter(
    (property) =>
      canInvest(property) &&
      property.unitPrice <= Number(preferences.budget) &&
      property.tenureMonths <= Number(preferences.horizon) &&
      (preferences.location === "all" || property.city === preferences.location) &&
      (preferences.risk !== "conservative" || property.targetRoi <= 15)
  )
    .toSorted((a, b) => {
      const held = (id: string) =>
        preferences.portfolio && HOLDINGS.some((holding) => holding.property.id === id) ? 1 : 0;
      const riskScore = (roi: number) => (preferences.risk === "balanced" ? Math.abs(roi - 14) : -roi);
      return held(a.id) - held(b.id) || riskScore(a.targetRoi) - riskScore(b.targetRoi);
    })
    .slice(0, 2);
}
export const MARKET_HISTORY = [
  { month: "Jan", lagos: 1, abuja: 0 },
  { month: "Feb", lagos: 3, abuja: 1 },
  { month: "Mar", lagos: 2.5, abuja: 2 },
  { month: "Apr", lagos: 6, abuja: 4 },
  { month: "May", lagos: 8, abuja: 3.8 },
  { month: "Jun", lagos: 9, abuja: 6.5 },
  { month: "Jul", lagos: 12.5, abuja: 8 },
  { month: "Aug", lagos: 11.5, abuja: 9.5 },
  { month: "Sep", lagos: 15, abuja: 11 },
  { month: "Oct", lagos: 18, abuja: 14 },
];
export const RECOMMENDATION_HISTORY: RecommendationRecord[] = [
  {
    id: "history-1",
    date: "22 Oct 2026",
    snapshot: "Balanced · 12 months · ₦500,000",
    recommendation: "Golden Estate · demo match",
    outcome: "Viewed prospectus",
  },
  {
    id: "history-2",
    date: "15 Oct 2026",
    snapshot: "Balanced · Abuja · ₦300,000",
    recommendation: "Palm Court · demo match",
    outcome: "Saved",
  },
  {
    id: "history-3",
    date: "08 Oct 2026",
    snapshot: "Conservative · 18 months",
    recommendation: "Cedar Gardens · demo match",
    outcome: "Dismissed",
  },
];
