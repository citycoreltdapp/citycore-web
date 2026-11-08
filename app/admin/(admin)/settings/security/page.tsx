import { Client$SecuritySettingsPage } from "@/app/dashboard/(dashboard)/settings/security/page";

import { SecurityExtras } from "../_security-extras";

export default function Page() {
  return (
    <>
      <Client$SecuritySettingsPage showNavigation={false} />
      <SecurityExtras />
    </>
  );
}
