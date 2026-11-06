"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { ProfileCard } from "./_profile-card";
import { AddressCard, DeleteAccountCard, PrivacyCard } from "./_profile-options";
import { SettingsNavigation } from "./_shared";

export function Client$SettingsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SettingsNavigation />
        <Button className="h-10 rounded-full px-5" render={<Link href="/onboarding" />} nativeButton={false}>
          Open an Account
        </Button>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ProfileCard />
        <div className="flex min-w-0 flex-col gap-5">
          <AddressCard />
          <PrivacyCard />
          <DeleteAccountCard />
        </div>
      </div>
    </>
  );
}
