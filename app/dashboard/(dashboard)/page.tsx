import { WelcomeBanner } from "./_welcome-banner";
import { Client$DashboardPage } from "./page.client";

export default function DashboardPage() {
  return (
    <>
      <WelcomeBanner />
      <Client$DashboardPage />
    </>
  );
}
