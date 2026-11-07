"use client";
import * as React from "react";

import { type AdminInvestment, adminInvestmentSchema } from "@/constant/schemas/admin-investments";
import { toast } from "sonner";
import { z } from "zod";

import { ADMIN_INVESTMENTS } from "./_data";

const KEY = "citycore-admin-investments-v1";
const Context = React.createContext<{
  investments: AdminInvestment[];
  ready: boolean;
  save: (record: AdminInvestment) => boolean;
} | null>(null);
export function InvestmentsProvider({ children }: { children: React.ReactNode }) {
  const [investments, setInvestments] = React.useState(ADMIN_INVESTMENTS);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = z.array(adminInvestmentSchema).safeParse(JSON.parse(raw));
          if (parsed.success) setInvestments(parsed.data);
          else toast.error("Saved investment data could not be read");
        }
      } catch {
        toast.error("Investment storage is unavailable");
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  const save = (record: AdminInvestment) => {
    if (!ready) return false;
    const parsed = adminInvestmentSchema.safeParse(record);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return false;
    }
    try {
      const raw = localStorage.getItem(KEY);
      const current = raw ? z.array(adminInvestmentSchema).parse(JSON.parse(raw)) : investments;
      const existing = current.find((i) => i.id === record.id);
      if (existing && record.version !== existing.version + 1) {
        toast.error("This investment changed in another tab. Reload before saving.");
        return false;
      }
      const next = [parsed.data, ...current.filter((i) => i.id !== record.id)];
      localStorage.setItem(KEY, JSON.stringify(next));
      setInvestments(next);
      return true;
    } catch {
      toast.error(
        "Couldn't save the investment. Your entries are still here; try a smaller cover image if storage is full."
      );
      return false;
    }
  };
  return <Context.Provider value={{ investments, ready, save }}>{children}</Context.Provider>;
}
export function useAdminInvestments() {
  const value = React.useContext(Context);
  if (!value) throw new Error("InvestmentsProvider is required");
  return value;
}
