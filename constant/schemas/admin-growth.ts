import { z } from "zod";

import { notificationTopicSchema } from "../notifications";

const text = z.string().trim().min(1, "Please complete every field").max(2000);
export const adminGrowthStateSchema = z.object({
  program: text,
  reward: text,
  qualification: text,
  cap: text,
  attribution: text,
  link: text,
  review: z.boolean(),
  code: text,
  benefit: text,
  validity: text,
  limits: text,
  eligibility: text,
  channel: text,
  template: text,
  audience: text,
  subject: text,
  body: text,
  topic: notificationTopicSchema,
  cta: text,
  schedule: text,
  owner: text,
  sms: text.max(160, "SMS must be 160 characters or fewer"),
  memo: text,
  incentiveStatus: z.enum(["draft", "pending"]),
  promoStatus: z.enum(["draft", "pending"]),
  broadcastStatus: z.enum(["draft", "pending"]),
  smsStatus: z.enum(["draft", "pending"]),
});
export type GrowthDraft = z.infer<typeof adminGrowthStateSchema>;
