"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { ApiError } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The API client already retries; a 4xx won't fix itself.
        retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}

// Screens whose actions aren't written yet read sample data through these. Each moves to an
// actions/ hook once its endpoint exists, as auth has.

export function useMockQuery<T>({ key, schema, mock }: { key: string; schema: z.ZodType<T>; mock: unknown }) {
  return useQuery({
    queryKey: [key],
    queryFn: () => schema.parse(mock),
    initialData: () => schema.parse(mock),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useMockMutation<S extends z.ZodType, R extends z.ZodType>({
  bodySchema,
  schema,
  mock,
  invalidates = [],
}: {
  bodySchema: S;
  schema: R;
  /** The reply: a value, or one built from the parsed body. */
  mock: unknown | ((body: z.output<S>) => unknown);
  /** Query keys to refetch after success. */
  invalidates?: string[];
}) {
  const queryClient = useQueryClient();
  return useMutation<z.output<R>, ApiError, z.input<S> & { idempotencyKey?: string }>({
    mutationFn: async (body) => {
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) throw new ApiError(parsed.error.issues[0].message, 0, "VALIDATION_ERROR", parsed.error);
      return schema.parse(typeof mock === "function" ? mock(parsed.data) : mock);
    },
    onSuccess: async () => {
      await Promise.all(invalidates.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
