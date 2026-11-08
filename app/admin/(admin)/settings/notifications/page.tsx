"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { adminNotificationPreferencesSchema } from "@/constant/schemas/admin-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Notice, PageLink, Panel } from "../../_operations/ui";
import { usePreviewState } from "../../_operations/use-preview-state";
import { NOTIFICATION_DEFAULTS } from "../../_operations/workspace-data";

type Values = z.infer<typeof adminNotificationPreferencesSchema>;
const CHANNELS = [
  { id: "email", label: "Email Notification" },
  { id: "sms", label: "SMS Notification" },
  { id: "push", label: "Push Notification" },
  { id: "news", label: "News Flash" },
  { id: "buzz", label: "Buzz Alert" },
  { id: "updates", label: "Update Notification" },
] as const;
export default function NotificationSettings() {
  const store = usePreviewState(
    "citycore-admin-notifications-v1",
    adminNotificationPreferencesSchema,
    NOTIFICATION_DEFAULTS
  );
  if (!store.ready) return <Skeleton className="h-96" />;
  return <NotificationForm value={store.value} save={store.save} />;
}
function NotificationForm({ value, save }: { value: Values; save: (v: Values) => boolean }) {
  const form = useForm<Values>({ resolver: zodResolver(adminNotificationPreferencesSchema), defaultValues: value });
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((v) => {
        if (save(v)) {
          form.reset(v);
          toast.success("Notification preferences saved locally");
        }
      })}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Notification</h2>
        <div className="flex flex-wrap gap-2">
          <PageLink href="/settings/limits">Payment limits</PageLink>
          <Button type="button" variant="outline" onClick={() => form.reset(value)}>
            Cancel changes
          </Button>
          <Button type="submit">Save preferences</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {CHANNELS.map((channel) => (
          <Panel key={channel.id} title={channel.label}>
            {(
              [
                { id: "activity", label: "Account Activity", help: "Activity updates for your selected channel" },
                { id: "communications", label: "Communications", help: "Messages and service updates" },
                { id: "meetups", label: "Meetups near you", help: "Optional local events and announcements" },
              ] as const
            ).map((topic) => (
              <Controller
                key={topic.id}
                control={form.control}
                name={`${channel.id}.${topic.id}`}
                render={({ field }) => (
                  <label className="flex items-start justify-between gap-4 py-2">
                    <span>
                      <span className="block text-sm font-medium">{topic.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{topic.help}</span>
                    </span>
                    <Switch
                      aria-label={`${channel.label} · ${topic.label}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />
            ))}
          </Panel>
        ))}
      </div>
      <Notice>
        Essential security notices remain enabled. These channel preferences are local previews; no emails, SMS messages
        or push notifications are sent.
      </Notice>
    </form>
  );
}
