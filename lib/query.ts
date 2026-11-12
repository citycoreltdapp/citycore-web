"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { LIVE_ROUTES } from "./api";
import { ApiError, type RequestConfig, api, isMockApi, unwrap } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The client already retries; a 4xx won't fix itself.
        retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}

const liveRoute = (path: string) => (isMockApi ? undefined : LIVE_ROUTES[path]);

export function useApiQuery<T>({
  path,
  schema,
  mock,
  query,
  enabled = true,
}: {
  path: string;
  schema: z.ZodType<T>;
  /** Served until the route is in LIVE_ROUTES and NEXT_PUBLIC_API_URL is set. */
  mock: unknown;
  query?: RequestConfig<T>["query"];
  enabled?: boolean;
}) {
  const live = liveRoute(path);
  return useQuery({
    queryKey: query ? [path, query] : [path],
    queryFn: ({ signal }) =>
      live
        ? api.get(path, { schema: live.schema.pipe(schema), query: { ...live.query, ...query }, signal }).then(unwrap)
        : schema.parse(mock),
    enabled,
    ...(!live && {
      initialData: () => schema.parse(mock),
      initialDataUpdatedAt: 0,
      staleTime: Number.POSITIVE_INFINITY,
    }),
  });
}

export function useApiMutation<S extends z.ZodType, R extends z.ZodType>({
  path,
  method = "post",
  bodySchema,
  schema,
  mock,
  invalidates = [],
}: {
  path: string | ((body: z.output<S>) => string);
  method?: "post" | "put" | "patch" | "delete";
  bodySchema: S;
  schema: R;
  /** Served until the route is live: a value, or one built from the parsed body. */
  mock: unknown | ((body: z.output<S>) => unknown);
  /** Query paths to refetch after success. */
  invalidates?: string[];
}) {
  const queryClient = useQueryClient();
  return useMutation<z.output<R>, ApiError, z.input<S> & { idempotencyKey?: string }>({
    mutationFn: async ({ idempotencyKey, ...body }) => {
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) throw new ApiError(parsed.error.issues[0].message, 0, "VALIDATION_ERROR", parsed.error);
      const url = typeof path === "function" ? path(parsed.data) : path;
      if (!liveRoute(url)) return schema.parse(typeof mock === "function" ? mock(parsed.data) : mock);
      const config = { schema: schema as z.ZodType<z.output<R>>, idempotencyKey };
      return unwrap(
        method === "delete" ? await api.delete(url, config) : await api[method](url, parsed.data as unknown, config)
      );
    },
    onSuccess: async () => {
      await Promise.all(invalidates.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
