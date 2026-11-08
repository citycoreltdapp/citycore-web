export const MAIL_AS_OF = "2026-11-08";
export const MAX_EMAIL_ATTEMPTS = 5;

export const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

/** 29 February is observed on 28 February when the year is not a leap year. */
export const birthdaySendOn = (month: number, day: number, year: number) => {
  const sendDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return `${year}-${String(month).padStart(2, "0")}-${String(sendDay).padStart(2, "0")}`;
};

export const nextBirthdaySend = (month: number, day: number, asOf = MAIL_AS_OF) => {
  const year = Number(asOf.slice(0, 4));
  const thisYear = birthdaySendOn(month, day, year);
  return thisYear >= asOf ? thisYear : birthdaySendOn(month, day, year + 1);
};

export const emailDecision = ({
  security,
  emailOptIn,
  birthdayAlreadySent = false,
}: {
  security: boolean;
  emailOptIn: boolean;
  birthdayAlreadySent?: boolean;
}) => {
  if (birthdayAlreadySent) return { status: "skipped" as const, detail: "Already sent this year" };
  if (!security && !emailOptIn) return { status: "skipped" as const, detail: "Email notifications are off" };
  return {
    status: "queued" as const,
    detail: security ? "Security email. Notification preferences do not apply." : "Queued for delivery",
  };
};
