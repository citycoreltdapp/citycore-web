import { Suspense } from "react";

import { SettingsProvider } from "@/app/dashboard/(dashboard)/settings/_settings-provider";

import { AdminSettingsNavigation } from "./_navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, security, preferences and payment-limit previews.</p>
      </header>
      <Suspense>
        <AdminSettingsNavigation />
      </Suspense>
      {children}
    </SettingsProvider>
  );
}
