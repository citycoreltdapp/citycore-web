// ponytail: mock notifications. Replace with an API call once the backend exists.

export type NotificationType = "deposit" | "withdrawal" | "investment" | "market" | "security";

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  group: "Today" | "Earlier";
  isRead: boolean;
}

export const NOTIFICATIONS: DashboardNotification[] = [
  {
    id: "1",
    type: "deposit",
    title: "Wallet funded",
    description: "₦250,000.00 was added to your wallet from your bank account.",
    time: "2m",
    group: "Today",
    isRead: false,
  },
  {
    id: "2",
    type: "investment",
    title: "Investment returns paid",
    description: "Your Lekki Gardens investment paid out ₦48,500.00.",
    time: "1h",
    group: "Today",
    isRead: false,
  },
  {
    id: "3",
    type: "security",
    title: "New sign-in to your account",
    description: "Chrome on macOS, Lagos. If this wasn't you, change your password.",
    time: "4h",
    group: "Today",
    isRead: false,
  },
  {
    id: "4",
    type: "withdrawal",
    title: "Withdrawal completed",
    description: "₦120,000.00 was sent to your GTBank account ending in 4291.",
    time: "1d",
    group: "Earlier",
    isRead: true,
  },
  {
    id: "5",
    type: "market",
    title: "New market insight",
    description: "Land prices in Abuja rose 12% this quarter. See what's driving it.",
    time: "2d",
    group: "Earlier",
    isRead: true,
  },
  {
    id: "6",
    type: "investment",
    title: "New opportunity in the marketplace",
    description: "A new residential plot in Ibadan is now open for investment.",
    time: "3d",
    group: "Earlier",
    isRead: true,
  },
];
