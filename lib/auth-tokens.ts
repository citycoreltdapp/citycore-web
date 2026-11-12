"use client";

import { SESSION_COOKIE } from "@/constant/auth";

const SESSION_DAYS = 7;
const EXPIRY_MARGIN_MS = 30_000;
export const SESSION_EXPIRED_EVENT = "citycore:session-expired";

let accessToken: string | null = null;
let expiresAt = 0;

function readExpiry(token: string) {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function writeCookie(value: string, maxAge: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure}`;
}

export function getAccessToken() {
  if (accessToken && expiresAt && Date.now() > expiresAt - EXPIRY_MARGIN_MS) accessToken = null;
  return accessToken;
}

export function hasSession() {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${SESSION_COOKIE}=1`);
}

export function setSession(token: string) {
  accessToken = token;
  expiresAt = readExpiry(token);
  writeCookie("1", SESSION_DAYS * 86_400);
}

export function clearSession({ expired = false } = {}) {
  accessToken = null;
  expiresAt = 0;
  if (typeof document === "undefined") return;
  writeCookie("", 0);
  if (expired) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
