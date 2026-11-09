import { InvestmentsProvider } from "../investments/_store";

// Returns read each investment's payout terms, so they share the investments store.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <InvestmentsProvider>{children}</InvestmentsProvider>;
}
