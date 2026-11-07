import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { UserManagement } from "./page.client";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <UserManagement />
    </Suspense>
  );
}
