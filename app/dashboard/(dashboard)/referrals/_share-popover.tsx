"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Copy01Icon,
  Facebook01Icon,
  Linkedin01Icon,
  Mail01Icon,
  NewTwitterIcon,
  Share08Icon,
  SmartPhone01Icon,
  TelegramIcon,
  Tick02Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "cn";
import { toast } from "sonner";

/** The short link next.config redirects to sign-up with the code filled in. */
export const shortInviteLink = (code: string) => `${window.location.origin}/r/${encodeURIComponent(code)}`;

const e = encodeURIComponent;
type Channel = { name: string; icon: IconSvgElement; color: string; href: (text: string, url: string) => string };

const CHANNELS: Channel[] = [
  { name: "WhatsApp", icon: WhatsappIcon, color: "#25D366", href: (t, u) => `https://wa.me/?text=${e(`${t} ${u}`)}` },
  {
    name: "X",
    icon: NewTwitterIcon,
    color: "currentColor",
    href: (t, u) => `https://x.com/intent/post?text=${e(t)}&url=${e(u)}`,
  },
  {
    name: "Facebook",
    icon: Facebook01Icon,
    color: "#1877F2",
    href: (_, u) => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`,
  },
  {
    name: "LinkedIn",
    icon: Linkedin01Icon,
    color: "#0A66C2",
    href: (_, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`,
  },
  {
    name: "Telegram",
    icon: TelegramIcon,
    color: "#229ED9",
    href: (t, u) => `https://t.me/share/url?url=${e(u)}&text=${e(t)}`,
  },
  {
    name: "Email",
    icon: Mail01Icon,
    color: "currentColor",
    href: (t, u) => `mailto:?subject=${e("Join me on City Core")}&body=${e(`${t}\n\n${u}`)}`,
  },
  { name: "SMS", icon: SmartPhone01Icon, color: "currentColor", href: (t, u) => `sms:?&body=${e(`${t} ${u}`)}` },
];

const TILE =
  "flex flex-col items-center gap-1.5 rounded-xl p-2 text-[11px] text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function SharePopover({ code, className }: { code: string; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [link, setLink] = React.useState("");
  const text = `I invest in property with City Core. Sign up with my code ${code} and start from a single unit:`;

  // window only exists in the browser, so the link is built when the popover opens.
  const changeOpen = (next: boolean) => {
    if (next) setLink(shortInviteLink(code));
    setCopied(false);
    setOpen(next);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it instead.");
    }
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share invite"
            className={cn(
              "size-11 rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white data-popup-open:bg-white/15",
              className
            )}
          />
        }
      >
        <HugeiconsIcon icon={Share08Icon} aria-hidden />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 overflow-hidden rounded-2xl p-0">
        <div className="flex flex-col gap-1 p-4 pb-3">
          <p className="text-sm font-semibold">Share your invite</p>
          <p className="text-xs/5 text-muted-foreground">
            The link opens City Core sign-up with <span className="font-mono text-foreground">{code}</span> filled in.
          </p>
        </div>

        <div className="mx-4 flex items-center gap-2 rounded-xl border border-border bg-muted/50 py-1 pr-1 pl-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs" title={link}>
            {link.replace(/^https?:\/\//, "")}
          </span>
          <Button size="sm" className="h-8 rounded-lg px-2.5" onClick={copy} disabled={!link}>
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} aria-hidden />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <ul className="grid grid-cols-4 gap-1 p-3" aria-label="Share to">
          {CHANNELS.map((channel) => {
            const isWeb = channel.href(text, link).startsWith("https");
            return (
              <li key={channel.name}>
                <a
                  href={channel.href(text, link)}
                  target={isWeb ? "_blank" : undefined}
                  rel={isWeb ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className={TILE}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted ring-1 ring-foreground/5">
                    <HugeiconsIcon
                      icon={channel.icon}
                      aria-hidden
                      className="size-5"
                      style={{ color: channel.color }}
                    />
                  </span>
                  {channel.name}
                </a>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
