import type { ReactNode } from "react";

import { SettingsProvider } from "./_settings-provider";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, address, security and notifications.</p>
      </header>
      {children}
    </SettingsProvider>
  );
}
