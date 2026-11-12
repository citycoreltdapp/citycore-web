"use client";

import ky, { type Options, isHTTPError, isNetworkError, isTimeoutError } from "ky";
import type { z } from "zod";

import { clearSession, getAccessToken, hasSession, setSession } from "./auth-tokens";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "API_ERROR",
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ApiResult<T> = { ok: true; data: T; meta?: ApiMeta } | { ok: false; error: ApiError };

const fail = (message: string, status = 0, code?: string, details?: unknown): ApiResult<never> => ({
  ok: false,
  error: new ApiError(message, status, code, details),
});

export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) throw result.error;
  return result.data;
}

const record = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
const text = (value: unknown) => (typeof value === "string" ? value : undefined);

function readApiError(body: unknown, status: number): ApiError {
  const root = record(body);
  const fields = Array.isArray(root?.errors) ? root.errors : undefined;
  const code = text(root?.code) ?? (status === 401 ? "UNAUTHORIZED" : "API_ERROR");
  const message =
    (code === "VALIDATION_ERROR" ? text(record(fields?.[0])?.message) : undefined) ??
    text(root?.message) ??
    (status >= 500 ? "Something went wrong on our side. Try again." : "Something went wrong");
  return new ApiError(message, status, code, fields);
}

const http = ky.create({
  prefix: API_BASE_URL ?? undefined,
  credentials: "include",
  timeout: 30_000,
  retry: { limit: 2, methods: ["get", "put", "delete", "head"], statusCodes: [408, 429, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getAccessToken();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
  },
});

let refreshing: Promise<boolean> | null = null;

export function refreshSession() {
  refreshing ??= http
    .post("auth/refresh", { retry: 0, timeout: 15_000 })
    .json<{ data?: { accessToken?: unknown } }>()
    .then(({ data }) => {
      if (typeof data?.accessToken !== "string") throw new Error("No access token");
      setSession(data.accessToken);
      return true;
    })
    .catch(() => {
      clearSession({ expired: true });
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export interface RequestConfig<T> {
  schema?: z.ZodType<T>;
  query?: Record<string, string | number | boolean | null | undefined>;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function send<T>(
  method: string,
  path: string,
  config: RequestConfig<T> & { json?: unknown; body?: FormData }
): Promise<ApiResult<T>> {
  if (!API_BASE_URL) return fail("The API isn't configured. Set NEXT_PUBLIC_API_URL.", 0, "NOT_CONFIGURED");

  const { schema, query, idempotencyKey } = config;
  const route = path.replace(/^\/+/, "");
  const canRefresh = !route.startsWith("auth/");
  const options: Options = {
    method,
    json: config.json,
    body: config.body,
    signal: config.signal,
    searchParams:
      query &&
      (Object.fromEntries(Object.entries(query).filter(([, value]) => value != null)) as Record<
        string,
        string | number | boolean
      >),
    headers: idempotencyKey ? { ...config.headers, "Idempotency-Key": idempotencyKey } : config.headers,
    ...(idempotencyKey && { retry: { limit: 2, methods: [method.toLowerCase() as "post"] } }),
  };

  if (canRefresh && !getAccessToken() && hasSession()) await refreshSession();

  const attempt = async (refreshed: boolean): Promise<ApiResult<T>> => {
    let body: unknown;
    try {
      const raw = await (await http(route, options)).text();
      body = raw ? JSON.parse(raw) : null;
    } catch (error) {
      if (isHTTPError(error)) {
        const { status } = error.response;
        if (status === 401 && canRefresh && !refreshed && hasSession() && (await refreshSession()))
          return attempt(true);
        if (status === 401 && canRefresh) clearSession({ expired: true });
        return { ok: false, error: readApiError(error.data, status) };
      }
      if (isTimeoutError(error)) return fail("The request took too long. Try again.", 0, "TIMEOUT");
      if (isNetworkError(error)) return fail("Check your internet connection and try again.", 0, "NETWORK");
      if (error instanceof DOMException && error.name === "AbortError") return fail("Request cancelled.", 0, "ABORTED");
      return fail(error instanceof Error ? error.message : "Request failed");
    }

    const envelope = record(body);
    const data = envelope && "success" in envelope ? envelope.data : body;
    const meta = envelope?.meta as ApiMeta | undefined;
    if (!schema) return { ok: true, data: data as T, meta };
    const parsed = schema.safeParse(data);
    if (parsed.success) return { ok: true, data: parsed.data, meta };
    console.error(`Unexpected response from ${method} /${route}`, parsed.error);
    return fail("The server sent an unexpected response.", 0, "INVALID_RESPONSE", parsed.error);
  };
  return attempt(false);
}

function withBody(method: string) {
  return async <T, S extends z.ZodType = z.ZodType>(
    path: string,
    body?: z.input<S>,
    config: RequestConfig<T> & { bodySchema?: S } = {}
  ): Promise<ApiResult<T>> => {
    const { bodySchema, ...rest } = config;
    if (!bodySchema) return send<T>(method, path, { ...rest, json: body });
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(`${issue.path.join(".") || "Request"}: ${issue.message}`, 0, "VALIDATION_ERROR", parsed.error);
    }
    return send<T>(method, path, { ...rest, json: parsed.data });
  };
}

export const api = {
  get<T>(path: string, config: RequestConfig<T> = {}) {
    return send<T>("GET", path, config);
  },
  post: withBody("POST"),
  put: withBody("PUT"),
  patch: withBody("PATCH"),
  delete<T>(path: string, config: RequestConfig<T> = {}) {
    return send<T>("DELETE", path, config);
  },
  upload<T>(
    path: string,
    form: FormData,
    { method = "POST", ...config }: RequestConfig<T> & { method?: "POST" | "PUT" } = {}
  ) {
    return send<T>(method, path, { ...config, body: form });
  },
};

export function fieldErrors(error: ApiError): Record<string, string> {
  if (!Array.isArray(error.details)) return {};
  return Object.fromEntries(
    error.details
      .filter((detail): detail is { path: string; message: string } => typeof detail?.path === "string")
      .map(({ path, message }) => [path.replace(/^body\./, ""), message])
  );
}
