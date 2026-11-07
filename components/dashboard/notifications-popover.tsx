"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type DashboardNotification, NOTIFICATIONS, type NotificationType } from "@/constant/notifications";
import {
  Analytics01Icon,
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  ChartIncreaseIcon,
  Notification01Icon,
  SecurityCheckIcon,
  TickDouble02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "cn";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

const TYPE_STYLES: Record<NotificationType, { icon: IconSvgElement; className: string }> = {
  deposit: { icon: ArrowDownLeft01Icon, className: "bg-chart-4/15 text-chart-4" },
  withdrawal: { icon: ArrowUpRight01Icon, className: "bg-chart-5/15 text-chart-5" },
  investment: { icon: ChartIncreaseIcon, className: "bg-chart-2/15 text-chart-2" },
  market: { icon: Analytics01Icon, className: "bg-chart-3/20 text-chart-5" },
  security: { icon: SecurityCheckIcon, className: "bg-destructive/10 text-destructive" },
};

const GROUPS = ["Today", "Earlier"] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function UnreadBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          aria-hidden
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 26 }}
          className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ring-2 ring-sidebar"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({
  notification,
  index,
  onRead,
}: {
  notification: DashboardNotification;
  index: number;
  onRead: (id: string) => void;
}) {
  const { id, type, title, description, time, isRead } = notification;
  const { icon, className } = TYPE_STYLES[type];

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25, ease: EASE_OUT, delay: index * 0.03 }}
    >
      <button
        type="button"
        onClick={() => onRead(id)}
        className="flex w-full cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}>
          <HugeiconsIcon icon={icon} aria-hidden className="size-4.5" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className={cn("truncate text-sm", isRead ? "text-muted-foreground" : "font-medium text-foreground")}>
              {title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{time}</span>
          </span>
          <span className="flex items-start justify-between gap-3">
            <span className="line-clamp-2 text-xs/5 text-muted-foreground">{description}</span>
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full bg-primary transition-[opacity,scale] duration-200",
                isRead && "scale-0 opacity-0"
              )}
            >
              {!isRead && <span className="sr-only">Unread</span>}
            </span>
          </span>
        </span>
      </button>
    </motion.li>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.15 }}
      className="flex flex-col items-center gap-1 px-6 py-12 text-center"
    >
      <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-chart-4/15 text-chart-4">
        <HugeiconsIcon icon={TickDouble02Icon} aria-hidden className="size-6" />
      </span>
      <p className="text-sm font-medium">You&apos;re all caught up</p>
      <p className="text-xs text-muted-foreground">New notifications will show up here.</p>
    </motion.div>
  );
}

export function NotificationsPopover({
  initialNotifications = NOTIFICATIONS,
}: {
  initialNotifications?: DashboardNotification[];
}) {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [tab, setTab] = React.useState("all");

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const visible = tab === "unread" ? notifications.filter((notification) => !notification.isRead) : notifications;

  const markAsRead = (id: string) =>
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
    );
  const markAllAsRead = () =>
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications, ${unreadCount} unread`}
            className="relative size-10 rounded-full bg-muted data-popup-open:bg-primary data-popup-open:text-primary-foreground [&_svg:not([class*='size-'])]:size-5"
          >
            <HugeiconsIcon icon={Notification01Icon} aria-hidden />
            <UnreadBadge count={unreadCount} />
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-xl sm:w-96"
      >
        <MotionConfig reducedMotion="user">
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <div className="flex flex-col gap-3 border-b border-dashed p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Notifications</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unreadCount === 0}
                  onClick={markAllAsRead}
                  className="-mr-2 text-primary hover:text-primary dark:text-foreground"
                >
                  <HugeiconsIcon icon={TickDouble02Icon} aria-hidden />
                  Mark all as read
                </Button>
              </div>

              <TabsList className="w-full" aria-label="Filter notifications">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value={tab}
              className="h-96 max-h-[60svh] flex-none overflow-y-auto overscroll-contain p-2 outline-none"
            >
              {visible.length === 0 ? (
                <EmptyState />
              ) : (
                GROUPS.map((group) => {
                  const items = visible.filter((notification) => notification.group === group);
                  if (items.length === 0) return null;

                  return (
                    <section key={group} className="not-first:mt-2">
                      <h3 className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{group}</h3>
                      <ul>
                        <AnimatePresence initial={false} mode="popLayout">
                          {items.map((notification, index) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              index={index}
                              onRead={markAsRead}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </section>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </MotionConfig>
      </PopoverContent>
    </Popover>
  );
}
