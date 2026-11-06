// ponytail: mock data from the Figma frame. Replace with an API call once the backend exists.
import type { Credit } from "@/constant/schemas/finance";

export type { Credit } from "@/constant/schemas/finance";
export type CreditStatus = Credit["status"];

const DESIGN_ROWS: [string, string, string, number, string, CreditStatus][] = [
  ["John Snow - Metal", "21/08/2024", "03:05 PM", 95200, "321,121.32", "Active"],
  ["John Snow - Virtual", "31/12/2025", "02:10 AM", 54448.54, "956,542.32", "Active"],
  ["John Snow - Metal", "58%", "Rate", 74215.32, "956,542.32", "Active"],
  ["John Snow - Virtual", "24%", "Rate", 67511.21, "987,245.32", "Pause"],
  ["John Snow - Metal", "23%", "Rate", 36122.54, "457,254.36", "Cancel"],
  ["John Snow - Virtual", "23%", "Rate", 75121.36, "457,254.36", "Active"],
  ["John Snow - Metal", "23%", "Rate", 88125, "457,254.36", "Active"],
  ["John Snow - Virtual", "23%", "Rate", 96214.03, "457,254.36", "Active"],
];

// The first 8 rows are from the design; the rest repeat them so paging has 100 entries to work with.
export const CREDITS: Credit[] = Array.from({ length: 100 }, (_, index) => {
  const [title, detail, detailNote, balance, interest, status] = DESIGN_ROWS[index % DESIGN_ROWS.length];

  return {
    key: String(index),
    title,
    card: "**4291 - Exp: 12/26",
    detail,
    detailNote,
    balance: balance + Math.floor(index / DESIGN_ROWS.length) * 50,
    interest,
    status,
  };
});
