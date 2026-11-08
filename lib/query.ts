"use client";

import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import ky from "ky";
import type { z } from "zod";

import { fromApi, toApi } from "./api";

/** Set NEXT_PUBLIC_API_URL to send these calls to the API. Until then they return the mock. */
const apiBase = process.env.NEXT_PUBLIC_API_URL;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
}

export async function fetchApi<T>(schema: z.ZodType<T>, path: string, mock: unknown): Promise<T> {
  if (!apiBase) return fromApi(schema, mock);
  return fromApi(schema, await ky.get(`${apiBase}${path}`).json());
}

export function useApiQuery<T>({ path, schema, mock }: { path: string; schema: z.ZodType<T>; mock: unknown }) {
  return useQuery({
    queryKey: [path],
    queryFn: () => fetchApi(schema, path, mock),
    initialData: apiBase ? undefined : fromApi(schema, mock),
    initialDataUpdatedAt: apiBase ? undefined : 0,
    staleTime: apiBase ? 30_000 : Number.POSITIVE_INFINITY,
  });
}

export function useApiMutation<T, B>({
  path,
  method = "post",
  bodySchema,
  schema,
  mock,
}: {
  path: string;
  method?: "post" | "put" | "patch";
  bodySchema: z.ZodType<B>;
  schema: z.ZodType<T>;
  mock: unknown | ((body: B) => unknown);
}) {
  return useMutation({
    mutationFn: async (body: z.input<z.ZodType<B>>) => {
      const payload = toApi(bodySchema, body);
      const sample = typeof mock === "function" ? mock(bodySchema.parse(body)) : mock;
      if (!apiBase) return fromApi(schema, sample);
      return fromApi(schema, await ky(apiBase + path, { method, json: payload }).json());
    },
  });
}
