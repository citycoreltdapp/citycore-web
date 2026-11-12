"use client";
import { type ReactNode, createContext, useContext, useState } from "react";

function useSettingsState() {
  const [visibility, setVisibility] = useState("anyone");
  const [twoFactorSelection, setTwoFactorSelection] = useState({ authenticator: false, sms: false, email: false });
  return { visibility, setVisibility, twoFactorSelection, setTwoFactorSelection };
}
const SettingsContext = createContext<ReturnType<typeof useSettingsState> | null>(null);
export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsState();
  return <SettingsContext value={settings}>{children}</SettingsContext>;
}
export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error("SettingsProvider is required");
  return settings;
}
