import type { z } from "zod";

/**
 * The API speaks snake_case JSON, the same payloads the mobile app reads in its `fromJson` factories.
 * Schemas and UI code use the camelCase names of the mobile model fields; convert only at this boundary.
 */
export const API_ROUTES = {
  // Mirrors citycorerunner_app/lib/core/constants/app_constants.dart.
  dashboard: "/dashboard",
  properties: "/properties",
  property: (id: string) => `/properties/${encodeURIComponent(id)}`,
  invest: (id: string) => `/properties/${encodeURIComponent(id)}/invest`,
  holdings: "/portfolio/holdings",
  holding: (id: string) => `/portfolio/holdings/${encodeURIComponent(id)}`,
  wallet: "/wallet",
  walletTransactions: "/wallet/transactions",
  withdraw: "/wallet/withdraw",
  fundWithCard: "/wallet/fund/card",
  // Not wired on mobile yet; the app serves these from mock services.
  payoutAccount: "/wallet/payout-account",
  ninLookup: "/kyc/nin",
  kycSubmission: "/kyc",
  referrals: "/referrals",
  resolveReferralCode: "/referrals/resolve",
  notifications: "/notifications",
} as const;

const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
const toSnake = (key: string) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

function mapKeys(value: unknown, rename: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, rename));
  if (value === null || typeof value !== "object" || value instanceof Date || value instanceof Blob) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [rename(key), mapKeys(item, rename)]));
}

/** Parses an API response. Never cast JSON to a type; parse it. */
export const fromApi = <T extends z.ZodType>(schema: T, json: unknown): z.output<T> =>
  schema.parse(mapKeys(json, toCamel));

/** Validates a request payload and returns the snake_case body to send. */
export const toApi = <T extends z.ZodType>(schema: T, payload: z.input<T>) =>
  mapKeys(schema.parse(payload), toSnake) as Record<string, unknown>;
