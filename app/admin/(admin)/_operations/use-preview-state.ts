"use client";
import * as React from "react";

import { toast } from "sonner";
import { z } from "zod";

// Browser-only preview data. Never pass credentials, identity documents or live financial state.
export function usePreviewState<T>(key: string, schema: z.ZodType<T>, initial: T) {
  const [value, setValue] = React.useState(initial);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = schema.safeParse(JSON.parse(raw));
          if (parsed.success) setValue(parsed.data);
          else toast.error("Saved preview data could not be read");
        }
      } catch {
        toast.error("Preview storage is unavailable");
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [key, schema]);
  const save = (next: T) => {
    if (!ready) return false;
    const parsed = schema.safeParse(next);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(parsed.data));
      setValue(parsed.data);
      return true;
    } catch {
      toast.error("Couldn't save the preview. Your entries are still here.");
      return false;
    }
  };
  return { value, save, ready };
}
