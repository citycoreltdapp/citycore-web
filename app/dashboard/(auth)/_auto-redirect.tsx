"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

/** Shows a spinner, then moves on. Uses replace so the back button doesn't land here and redirect again. */
export function AutoRedirect({ href, delayMs = 2500 }: { href: string; delayMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => router.replace(href), delayMs);

    return () => clearTimeout(timer);
  }, [router, href, delayMs]);

  return <Spinner aria-label="Redirecting" className="size-6 text-primary/60" />;
}
