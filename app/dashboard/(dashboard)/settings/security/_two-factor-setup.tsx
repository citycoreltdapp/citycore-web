"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Mail01Icon, Shield01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { toast } from "sonner";

import { SecurityIllustration } from "./_security-illustration";

export type TwoFactorMethod = "authenticator" | "sms" | "email";
export type TwoFactorSelection = Record<TwoFactorMethod, boolean>;
const OPTIONS = [
  {
    id: "authenticator",
    title: "Authenticator app",
    description: "Use an authenticator app to generate verification codes.",
    icon: Shield01Icon,
  },
  { id: "sms", title: "Phone number", description: "Set up SMS verification on your number.", icon: SmartPhone01Icon },
  { id: "email", title: "Email", description: "Use email for 2-step verification.", icon: Mail01Icon },
] as const;

export function TwoFactorSetup({
  initialSelection,
  onSave,
}: {
  initialSelection: TwoFactorSelection;
  onSave: (selection: TwoFactorSelection) => void;
}) {
  const [selection, setSelection] = useState(initialSelection);
  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl items-center">
      <Card className="w-full py-0 ring-0">
        <CardContent className="grid gap-8 p-4 md:grid-cols-[minmax(230px,0.75fr)_minmax(0,1.5fr)] md:p-6 lg:gap-12">
          <div className="relative min-h-64 overflow-hidden rounded-2xl md:min-h-120">
            <Image
              src="/assets/images/security/security-portrait.png"
              alt="A woman using her phone"
              fill
              priority
              sizes="(min-width: 768px) 35vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-black/90" />
            <div className="absolute inset-x-5 bottom-8 space-y-3 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-accent px-1.5 py-1 text-lg font-semibold text-accent-foreground">
                  City Core
                </span>
                <span className="text-xs">Ana is secured with</span>
              </div>
              <p className="max-w-72 text-2xl leading-tight font-semibold lg:text-3xl">
                Security is our top priority, get started.
              </p>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-lg flex-col justify-center gap-5">
            <h2 className="text-center text-xl font-semibold">Setup 2-Step Verification</h2>
            <SecurityIllustration />
            <div className="space-y-6">
              {OPTIONS.map((option) => (
                <div key={option.id} className="flex items-start gap-3">
                  <HugeiconsIcon icon={option.icon} className="mt-0.5 size-6 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor={`two-factor-${option.id}`} className="text-sm font-semibold">
                        {option.title}
                      </label>
                      {selection[option.id] && (
                        <Badge variant="secondary" className="text-[10px]">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    id={`two-factor-${option.id}`}
                    aria-label={option.title}
                    checked={selection[option.id]}
                    onCheckedChange={(checked) => setSelection((current) => ({ ...current, [option.id]: checked }))}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
            <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              Setup preview only. Saving selects your preferred methods; 2FA stays inactive until verification services
              are connected.
            </p>
            <div className="flex justify-end gap-3 border-t pt-5">
              <Button variant="ghost" className="h-10 rounded-full px-4" onClick={() => AppModal.close()}>
                Cancel
              </Button>
              <Button
                className="h-10 rounded-full px-5"
                disabled={!Object.values(selection).some(Boolean)}
                onClick={() => {
                  onSave(selection);
                  toast.info(
                    "2FA preferences saved for this settings session. Two-factor authentication has not been enabled."
                  );
                  AppModal.close();
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
