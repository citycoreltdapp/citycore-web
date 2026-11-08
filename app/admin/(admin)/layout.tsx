import { Suspense } from "react";

import { AdminShell } from "./_admin-shell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={null}>{children}</Suspense>
    </AdminShell>
  );
}
