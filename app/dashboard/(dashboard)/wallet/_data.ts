// ponytail: same figures as the mobile WalletMockData. Replace with GET /wallet once the backend exists.
import type { BankAccount, Wallet } from "@/constant/schemas/finance";

export type { BankAccount, Wallet } from "@/constant/schemas/finance";

export const WALLET: Wallet = {
  balance: 1_250_000,
  pendingWithdrawals: 150_000,
  fundingAccount: { bankName: "Wema Bank", accountNumber: "8123456790", accountName: "City Core / Ada Okafor" },
  payoutAccount: {
    bankName: "GTBank",
    bankCode: "058",
    accountNumber: "0124834821",
    accountName: "Ada Chiamaka Okafor",
  },
};

/** Same as the mobile BankAccount.masked getter. */
export const maskedAccount = ({ accountNumber }: BankAccount) =>
  accountNumber.length <= 4 ? accountNumber : `•••• ${accountNumber.slice(-4)}`;
