import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { KycReview } from "./page.client";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <KycReview />
    </Suspense>
  );
}
