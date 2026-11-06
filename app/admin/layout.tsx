import { ThemeToggle } from "@/components/primitives/theme-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CityCore Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {children}
    </>
  );
}
