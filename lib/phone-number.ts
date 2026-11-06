import { type TCountryCode, getCountryData } from "countries-list";
import { type CountryCode, isValidPhoneNumber, parsePhoneNumberWithError } from "libphonenumber-js";

export interface PhoneNumber {
  /** What's in the input, such as "0802 345 6789". */
  number: string;
  /** ISO country code, such as "NG". */
  countryCode: string;
}

export const DEFAULT_PHONE_COUNTRY = "NG";

export const EMPTY_PHONE_NUMBER: PhoneNumber = { number: "", countryCode: DEFAULT_PHONE_COUNTRY };

export const isPhoneNumberValid = ({ number, countryCode }: PhoneNumber) =>
  isValidPhoneNumber(number, countryCode as CountryCode);

const parse = ({ number, countryCode }: PhoneNumber) => {
  try {
    return parsePhoneNumberWithError(number, countryCode as CountryCode);
  } catch {
    return null;
  }
};

/** The form an API should store, such as "+2348023456789". */
export const phoneNumberToE164 = (phoneNumber: PhoneNumber) => parse(phoneNumber)?.number ?? phoneNumber.number;

/** For showing to people, such as "+234 802 345 6789". */
export const phoneNumberToString = (phoneNumber: PhoneNumber) => {
  const parsed = parse(phoneNumber);

  if (parsed?.isValid()) return parsed.formatInternational();

  const { phone } = getCountryData(phoneNumber.countryCode as TCountryCode);

  return `+${phone[0]} ${phoneNumber.number.replace(/\D/g, "")}`;
};
