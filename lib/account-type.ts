"use client";
import { useSyncExternalStore } from "react";

import { type AccountType, accountTypeSchema } from "@/constant/auth";

const STORAGE_KEY = "citycore.account-type.v1";
const CHANGE_EVENT = "citycore-account-type-change";

function read(): AccountType {
  try {
    return accountTypeSchema.catch("personal").parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "personal";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ponytail: the account type is saved on the account at sign-up; until accounts exist it lives in this browser.
export function setAccountType(accountType: AccountType) {
  try {
    window.localStorage.setItem(STORAGE_KEY, accountType);
  } catch {
    // Storage blocked: onboarding falls back to the personal flow.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** `null` until hydrated, so the server render never guesses which onboarding to show. */
export function useAccountType(): AccountType | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
