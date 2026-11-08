"use client";
import { useSyncExternalStore } from "react";

import { type KycStatus, kycStatusSchema } from "@/constant/onboarding";

const STORAGE_KEY = "citycore.kyc-status.v2";
const CHANGE_EVENT = "citycore-verification-change";

function read(): KycStatus {
  try {
    return kycStatusSchema.catch("notStarted").parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "notStarted";
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

// ponytail: no accounts API yet, so the status lives in this browser. Read `kycStatus` from GET /dashboard once it exists.
export function setKycStatus(status: KycStatus) {
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Storage blocked: the banner just keeps its current state.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** `null` until hydrated, so the server render never guesses the investor's status. */
export function useKycStatus(): KycStatus | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
