import {
  type ReferralDashboard,
  type ReferralPlan,
  type Referrer,
  referralCodeSchema,
  referralDashboardResponseSchema,
} from "@/constant/schemas/referrals";

// ponytail: same fixtures as the mobile ReferralMockService. Swap for the referrals API once it exists.
export const USER_REFERRAL_CODE = "CCADA26";

export const REFERRAL_PLAN: ReferralPlan = {
  id: "referral-12m",
  name: "City Core 12-month plan",
  commissionPercent: 2,
  tenureMonths: 12,
  annualRoiPercent: 16,
  commissionTerms:
    "In this sample plan, the referrer earns a one-time commission on each qualifying investment. Commission is credited after the investment is confirmed.",
};

const REFERRERS: Referrer[] = [
  { code: "CCCHIDI26", name: "Chidi" },
  { code: "CCAMINA26", name: "Amina" },
];

export const REFERRAL_DASHBOARD = referralDashboardResponseSchema.parse({
  code: USER_REFERRAL_CODE,
  downlines: [
    { id: "nkechi", name: "Nkechi O.", joined: "2026-10-09T09:12:00+01:00", hasInvested: true },
    { id: "tunde", name: "Tunde A.", joined: "2026-10-21T14:40:00+01:00", hasInvested: true },
    { id: "zainab", name: "Zainab M.", joined: "2026-11-05T11:05:00+01:00", hasInvested: false },
  ],
  commissions: [
    {
      id: "commission-3",
      title: "Nkechi O.",
      downlineId: "nkechi",
      packageName: "Golden Estate",
      amount: 6000,
      date: "2026-11-07T10:20:00+01:00",
      status: "pending",
    },
    {
      id: "commission-2",
      title: "Tunde A.",
      downlineId: "tunde",
      packageName: "Golden Estate",
      amount: 5000,
      date: "2026-10-29T16:02:00+01:00",
      status: "paid",
    },
    {
      id: "commission-1",
      title: "Nkechi O.",
      downlineId: "nkechi",
      packageName: "Golden Estate",
      amount: 9000,
      date: "2026-10-16T08:45:00+01:00",
      status: "paid",
    },
  ],
  investorReturns: [
    {
      id: "roi-1",
      title: "Your investment return",
      downlineId: null,
      packageName: "Palm Court Residences",
      amount: 42500,
      date: "2026-11-04T12:00:00+01:00",
      status: "paid",
    },
  ],
} satisfies ReferralDashboard);

export const commissionOn = (plan: ReferralPlan, amount: number) => (amount * plan.commissionPercent) / 100;

export function referralTotals({ downlines, commissions, investorReturns }: ReferralDashboard) {
  const sum = (items: ReferralDashboard["commissions"], status: "paid" | "pending") =>
    items.filter((item) => item.status === status).reduce((total, item) => total + item.amount, 0);
  return {
    commissionReceived: sum(commissions, "paid"),
    pendingCommission: sum(commissions, "pending"),
    roiPaid: sum(investorReturns, "paid"),
    activeReferrals: downlines.filter((person) => person.hasInvested).length,
  };
}

export class ReferralCodeError extends Error {}

export async function resolveReferralCode(code: string): Promise<Referrer> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const normalized = referralCodeSchema.parse(code);
  if (normalized === USER_REFERRAL_CODE) throw new ReferralCodeError("You cannot use your own referral code");
  const referrer = REFERRERS.find((r) => r.code === normalized);
  if (!referrer) throw new ReferralCodeError("Referral code not found. Check the code or leave it blank.");
  return referrer;
}
