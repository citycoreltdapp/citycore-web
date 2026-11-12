"use client";

import * as React from "react";

import { SESSION_EXPIRED_EVENT } from "@/lib/auth-tokens";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Sends the user to sign in when the API can't renew their session. */
export function SessionWatcher() {
  const router = useRouter();
  React.useEffect(() => {
    const onExpired = () => {
      toast.info("Your session ended. Sign in again to continue.");
      router.replace("/dashboard/signin");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router]);
  return null;
}
