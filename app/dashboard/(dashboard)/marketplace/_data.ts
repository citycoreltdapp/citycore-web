// Illustrative offerings. Replace with the marketplace API when the backend is available.
export interface Investment {
  id: string;
  name: string;
  location: string;
  image: string;
  annualRoi: number;
  tenure: number;
  unitPrice: number;
  totalUnits: number;
  allocatedUnits: number;
}

export const WALLET_BALANCE = 1_250_000;
export const AGREEMENT_VERSION = "1.3";
export const INVESTMENTS: Investment[] = [
  {
    id: "golden-estate",
    name: "Golden Estate",
    location: "Lekki, Lagos",
    image: "golden-estate",
    annualRoi: 16,
    tenure: 12,
    unitPrice: 150_000,
    totalUnits: 1000,
    allocatedUnits: 680,
  },
  {
    id: "silver-city",
    name: "Silver City",
    location: "Ikoyi, Lagos",
    image: "residences",
    annualRoi: 14,
    tenure: 12,
    unitPrice: 125_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "palm-residences",
    name: "Palm Residences",
    location: "Ajah, Lagos",
    image: "waterfront",
    annualRoi: 12,
    tenure: 18,
    unitPrice: 75_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "golden-heights",
    name: "Golden Heights",
    location: "Lekki, Lagos",
    image: "golden-estate",
    annualRoi: 14,
    tenure: 12,
    unitPrice: 150_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "ocean-view",
    name: "Ocean View",
    location: "Eko Atlantic, Lagos",
    image: "skyline",
    annualRoi: 16,
    tenure: 18,
    unitPrice: 200_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "city-lights",
    name: "City Lights",
    location: "Maitama, Abuja",
    image: "city-lights",
    annualRoi: 14,
    tenure: 12,
    unitPrice: 175_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "atlantic-towers",
    name: "Atlantic Towers",
    location: "Eko Atlantic, Lagos",
    image: "skyline",
    annualRoi: 16,
    tenure: 18,
    unitPrice: 200_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
  {
    id: "metropolitan-place",
    name: "Metropolitan Place",
    location: "Wuse, Abuja",
    image: "city-lights",
    annualRoi: 12,
    tenure: 12,
    unitPrice: 100_000,
    totalUnits: 800,
    allocatedUnits: 420,
  },
];

export const naira = (amount: number) =>
  `${amount < 0 ? "-" : ""}₦${Math.abs(amount).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
export const availableUnits = (investment: Investment) => investment.totalUnits - investment.allocatedUnits;
export const validUnits = (investment: Investment, units: number) =>
  Number.isSafeInteger(units) && units >= 1 && units <= availableUnits(investment);
export const initialUnits = (investment: Investment, raw: string | null) => {
  const units = raw === null ? 2 : Number(raw);
  return validUnits(investment, units) ? units : Math.min(2, availableUnits(investment));
};
export function estimateInvestment(investment: Investment, units: number) {
  const principal = investment.unitPrice * units;
  const projectedReturn =
    Math.round(((((principal * investment.annualRoi) / 100) * investment.tenure) / 12) * 100) / 100;
  return {
    principal,
    projectedReturn,
    maturity: principal + projectedReturn,
    balanceAfter: WALLET_BALANCE - principal,
  };
}
