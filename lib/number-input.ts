// What NumberField types and displays: raw text like "1234.5" shown as "1,234.5".

export const addCommas = (raw: string) => {
  const [int, dec] = raw.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? withCommas : `${withCommas}.${dec}`;
};

export const stripCommas = (text: string) => text.replace(/,/g, "");

export const isValidNumberText = (raw: string, allowDecimal: boolean) =>
  (allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/).test(raw);

export const parseNumberText = (raw: string) => {
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/** Where the caret belongs in formatted text, after `count` characters that aren't commas. */
export const caretPosition = (formatted: string, count: number) => {
  if (count === 0) return 0;

  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") seen++;
    if (seen === count) return i + 1;
  }
  return formatted.length;
};
