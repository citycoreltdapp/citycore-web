import { InvestmentsProvider } from "./_store";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <InvestmentsProvider>{children}</InvestmentsProvider>;
}
