"use client";
import * as React from "react";

import { type AdminReviewRequest, adminReviewRequestSchema } from "@/constant/schemas/admin-people";
import { toast } from "sonner";
import { z } from "zod";

const KEY = "citycore-admin-review-requests-v1";
// These are local preview requests, never authoritative account or permission changes.
export function useReviewRequests() {
  const [requests, setRequests] = React.useState<AdminReviewRequest[]>([]);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = z.array(adminReviewRequestSchema).safeParse(JSON.parse(raw));
          if (parsed.success) setRequests(parsed.data);
          else toast.error("Saved review requests could not be read");
        }
      } catch {
        toast.error("Review request storage is unavailable");
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  const submit = (
    input: Pick<AdminReviewRequest, "kind" | "subjectId" | "summary" | "reason"> &
      Partial<Pick<AdminReviewRequest, "details">>,
    options?: { replaceDraft: boolean }
  ) => {
    if (!ready) return false;
    const request = adminReviewRequestSchema.parse({
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      state: "pending-review",
    });
    try {
      const raw = localStorage.getItem(KEY);
      const previous = raw ? z.array(adminReviewRequestSchema).parse(JSON.parse(raw)) : [];
      const replaceDraft = options?.replaceDraft === true && ["return-schedule", "banking-config"].includes(input.kind);
      if (!replaceDraft && previous.some((item) => item.subjectId === input.subjectId && item.kind === input.kind)) {
        toast.info("A review request for this action is already pending");
        return false;
      }
      const next = [
        request,
        ...previous.filter((item) => !(replaceDraft && item.subjectId === input.subjectId && item.kind === input.kind)),
      ];
      localStorage.setItem(KEY, JSON.stringify(next));
      setRequests(next);
      toast.success("Local review request saved. No live changes applied.");
      return true;
    } catch {
      toast.error("Couldn't save the request. Your entries are still here.");
      return false;
    }
  };
  return { requests, submit, ready };
}
