"use client";
import * as React from "react";

import { type AdminInvoice, adminInvoiceSchema } from "@/constant/schemas/admin-account";
import { toast } from "sonner";
import { z } from "zod";

import { INITIAL_INVOICES } from "./_data";

const KEY = "citycore-admin-invoices-v1";
const Context = React.createContext<{
  invoices: AdminInvoice[];
  ready: boolean;
  save: (invoice: AdminInvoice) => boolean;
} | null>(null);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = React.useState(INITIAL_INVOICES);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    // Hydrate browser storage after SSR; the initial render must match the server.
    let active = true;
    queueMicrotask(() => {
      if (active) hydrate();
    });
    function hydrate() {
      try {
        const stored = localStorage.getItem(KEY);
        if (stored) {
          const parsed = z.array(adminInvoiceSchema).safeParse(JSON.parse(stored));
          if (parsed.success) setInvoices(parsed.data);
          else toast.error("Saved invoice data could not be read.");
        }
      } catch {
        toast.error("Invoice storage is unavailable.");
      }
      setReady(true);
    }
    return () => {
      active = false;
    };
  }, []);
  const save = (invoice: AdminInvoice) => {
    const parsed = adminInvoiceSchema.safeParse(invoice);
    if (!ready || !parsed.success) return false;
    const next = [parsed.data, ...invoices.filter((item) => item.id !== invoice.id)];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setInvoices(next);
      return true;
    } catch {
      toast.error("Couldn't save the invoice. Your entries are still here.");
      return false;
    }
  };
  return <Context.Provider value={{ invoices, ready, save }}>{children}</Context.Provider>;
}
export function useAccount() {
  const value = React.useContext(Context);
  if (!value) throw new Error("AccountProvider is required");
  return value;
}
