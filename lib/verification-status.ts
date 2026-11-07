"use client";
import { useSyncExternalStore } from "react";

export type VerificationStatus = "unverified" | "in-review" | "verified";

const STORAGE_KEY = "citycore.verification-status.v1";
const CHANGE_EVENT = "citycore-verification-change";
const STATUSES: VerificationStatus[] = ["unverified", "in-review", "verified"];

function read(): VerificationStatus {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return STATUSES.find((s) => s === raw) ?? "unverified";
  } catch {
    return "unverified";
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

// ponytail: no accounts API yet, so the status lives in this browser. Read it from the session once auth exists.
export function setVerificationStatus(status: VerificationStatus) {
  try {
    window.localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Storage blocked: the banner just keeps its current state.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** `null` until hydrated, so the server render never guesses the investor's status. */
export function useVerificationStatus(): VerificationStatus | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
