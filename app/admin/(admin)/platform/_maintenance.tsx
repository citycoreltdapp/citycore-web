"use client";

import { TextAreaField, TextField } from "@/components/primitives/text-field";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { PlatformState } from "@/constant/schemas/admin-platform";

import { StatusPill } from "../account/_ui";
import { CardHeader } from "../content/_ui";

export const watDate = (v: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${v}:00+01:00`));
const validWindow = (v: string) => !!v && !Number.isNaN(Date.parse(`${v}:00+01:00`));

export function MaintenanceCard({
  value,
  update,
}: {
  value: PlatformState;
  update: <K extends keyof PlatformState>(key: K, next: PlatformState[K]) => void;
}) {
  return (
    <Card className="min-w-0 gap-5 rounded-2xl px-5 py-5 ring-foreground/8">
      <CardHeader title="Maintenance mode" note="Scheduled downtime splash · activation needs approval">
        <StatusPill tone={value.maintenance ? "warning" : "muted"}>
          {value.maintenance ? "Scheduled in draft" : "Off"}
        </StatusPill>
      </CardHeader>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <span>
          <span className="block font-semibold">Schedule maintenance</span>
          <span className="block text-xs text-muted-foreground">
            Blocks new financial submissions during the window; support stays reachable
          </span>
        </span>
        <Switch
          checked={value.maintenance}
          onCheckedChange={(v) => update("maintenance", v)}
          aria-label="Schedule maintenance"
        />
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="maintenance-start"
              type="datetime-local"
              label="Starts · WAT"
              value={value.windowStart}
              onChange={(v) => update("windowStart", v)}
            />
            <TextField
              id="maintenance-end"
              type="datetime-local"
              label="Ends · WAT"
              value={value.windowEnd}
              onChange={(v) => update("windowEnd", v)}
            />
          </div>
          <TextField
            id="maintenance-headline"
            label="Headline"
            value={value.headline}
            onChange={(v) => update("headline", v)}
          />
          <TextAreaField
            id="maintenance-message"
            label="Message"
            value={value.message}
            onChange={(v) => update("message", v)}
            rows={3}
          />
        </div>

        <div className="relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#121212] p-6 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/2 size-64 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
          />
          <span className="relative rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">Splash preview</span>
          <p className="relative text-xl font-semibold">{value.headline}</p>
          <p className="relative max-w-xs text-sm/6 text-white/70">{value.message}</p>
          <p className="relative text-xs text-white/50 tabular-nums">
            {validWindow(value.windowEnd) ? `Back by ${watDate(value.windowEnd)} WAT` : "Choose when maintenance ends"}
          </p>
          <span className="relative mt-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#121212]">
            Contact support
          </span>
        </div>
      </div>
    </Card>
  );
}
