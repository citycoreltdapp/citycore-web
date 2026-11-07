import { statementRowsSchema } from "@/constant/schemas/admin-reports";

// Template CSV only. Bank-specific formats and authoritative matching belong to the reconciliation service.
export function parseStatementCsv(input: string) {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  const headers = rows.shift()?.map((v) => v.trim().toLowerCase());
  if (!headers || headers.join(",") !== "reference,date,amount")
    throw new Error("Use the CSV columns reference,date,amount");
  return statementRowsSchema.parse(
    rows.map((cells, index) => {
      if (cells.length !== 3 || !/^-?\d+(\.\d{1,2})?$/.test(cells[2].trim()))
        throw new Error(`Invalid amount or column count on row ${index + 2}`);
      return {
        reference: cells[0].trim(),
        date: cells[1].trim(),
        amount: Number(cells[2]),
        status: "unmatched",
        issue: "Awaiting reconciliation preview",
        owner: "Finance",
      };
    })
  );
}
export function reconciliationTotals(rows: { amount: number; status: string }[]) {
  const total = rows.reduce((s, r) => s + Math.round(Math.abs(r.amount) * 100), 0);
  const matched = rows
    .filter((r) => r.status === "matched")
    .reduce((s, r) => s + Math.round(Math.abs(r.amount) * 100), 0);
  return { total: total / 100, matched: matched / 100, unmatched: (total - matched) / 100 };
}
