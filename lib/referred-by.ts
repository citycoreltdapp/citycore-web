"use client";
import { useSyncExternalStore } from "react";

import { type Referrer, referrerSchema } from "@/constant/schemas/referrals";

const STORAGE_KEY = "citycore.referred-by.v1";
const CHANGE_EVENT = "citycore-referred-by-change";
let cached: { raw: string | null; value: Referrer | null } = { raw: null, value: null };

function read(): Referrer | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw !== cached.raw) {
    let value: Referrer | null = null;
    try {
      value = raw ? (referrerSchema.safeParse(JSON.parse(raw)).data ?? null) : null;
    } catch {
      value = null;
    }
    cached = { raw, value };
  }
  return cached.value;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ponytail: the referrer is attached to the account at sign-up; until accounts exist it lives in this browser.
export function setReferredBy(referrer: Referrer | null) {
  try {
    if (referrer) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(referrer));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the referrer just isn't shown.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useReferredBy(): Referrer | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
