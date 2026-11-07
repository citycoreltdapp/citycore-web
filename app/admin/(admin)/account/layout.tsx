import { AccountProvider } from "./_store";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountProvider>{children}</AccountProvider>;
}
