import { z } from "zod";

import { resourceIdSchema, timestampSchema } from "./schemas/common";

// Mirrors features/notifications/providers/notifications_provider.dart in the mobile app.
export const notificationTopicSchema = z.enum(["wallet", "investments", "account"]);
export const NOTIFICATION_TOPIC_LABELS: Record<NotificationTopic, string> = {
  wallet: "Wallet activity",
  investments: "Investment updates",
  account: "Account updates",
};

export const inboxMessageSchema = z.object({
  id: resourceIdSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  topic: notificationTopicSchema.nullish(),
  date: timestampSchema,
});
// GET /notifications returns a plain array, newest first. Read state is kept per device, as in the app.
export const inboxResponseSchema = z.array(inboxMessageSchema);
/** Topics the investor wants pushed. The app defaults to wallet and investments. */
export const notificationPreferencesSchema = z.array(notificationTopicSchema);
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationTopic[] = ["wallet", "investments"];

export type NotificationTopic = z.infer<typeof notificationTopicSchema>;
export type InboxMessage = z.infer<typeof inboxMessageSchema>;

/** Fixed "now" for the sample inbox, so relative times never read the clock during prerender. */
export const INBOX_AS_OF = "2026-11-08T12:00:00+01:00";

// ponytail: same messages as the app's NotificationInbox mock. Replace with fromApi(inboxResponseSchema, GET /notifications).
export const NOTIFICATIONS: InboxMessage[] = [
  {
    id: "funding",
    title: "Wallet funded",
    message: "Your bank transfer has been credited. Open Wallet to see your balance and transaction receipt.",
    topic: "wallet",
    date: "2026-11-08T10:00:00+01:00",
  },
  {
    id: "market",
    title: "New property in Market",
    message: "Explore Golden Estate in Lekki and review the investment details in Market.",
    topic: "investments",
    date: "2026-11-07T12:00:00+01:00",
  },
  {
    id: "welcome",
    title: "Welcome to City Core",
    message: "Visit Account to review your profile, identity verification and notification preferences.",
    topic: "account",
    date: "2026-11-04T12:00:00+01:00",
  },
];
export const READ_NOTIFICATION_IDS = ["welcome"];
