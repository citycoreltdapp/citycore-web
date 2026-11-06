"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

/** The "..." menu on a dashboard card. */
export function CardMenu({ label, items }: { label: string; items: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`${label} options`}>
            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        {items.map((item) => (
          // ponytail: no backend yet. Each item needs its own action once there is real data.
          <DropdownMenuItem key={item} onClick={() => toast.info(`${item} isn't connected to a backend yet.`)}>
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
