const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Default x-axis and tooltip label: ISO dates become "Mar 13", anything else is shown as is.
 * It checks the format because new Date("Week 1") is a valid date in V8. Date-only strings parse as UTC,
 * so they're formatted in UTC to stop them showing the previous day west of Greenwich.
 */
export const formatChartLabel = (value: string | number) => {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};
