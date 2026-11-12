"use client";

// The refresh token is an httpOnly cookie the server sets, so scripts never see it. The access token lives in
// memory only; after a reload the client gets a new one from the cookie.
const SIGNED_IN_KEY = "citycore.signedIn";
export const SESSION_EXPIRED_EVENT = "citycore:session-expired";

let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

/** Whether a refresh cookie is worth trying, so signed-out visitors don't make a pointless call. */
export function hasSession() {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSession(token: string) {
  accessToken = token;
  try {
    localStorage.setItem(SIGNED_IN_KEY, "1");
  } catch {}
}

export function clearSession({ expired = false } = {}) {
  accessToken = null;
  try {
    localStorage.removeItem(SIGNED_IN_KEY);
  } catch {}
  if (expired && typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
